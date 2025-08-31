#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Performance monitoring and reporting for the build process.
"""
import time
import json
import psutil
import os
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime
import threading
from concurrent.futures import ThreadPoolExecutor
import matplotlib.pyplot as plt

from build_logger import setup_logging

logger = setup_logging('performance_monitor')

class PerformanceMonitor:
    """监控构建过程的性能指标"""
    
    def __init__(self, output_dir: Path):
        self.output_dir = output_dir
        self.metrics_dir = output_dir / 'metrics'
        self.metrics_dir.mkdir(parents=True, exist_ok=True)
        
        self.start_time = time.time()
        self.metrics: Dict[str, List[Dict]] = {
            'cpu': [],
            'memory': [],
            'disk': [],
            'tasks': []
        }
        
        self._monitoring = False
        self._monitor_thread = None
        
    def start_monitoring(self, interval: float = 1.0) -> None:
        """开始性能监控"""
        self._monitoring = True
        self._monitor_thread = threading.Thread(
            target=self._monitor_resources,
            args=(interval,),
            daemon=True
        )
        self._monitor_thread.start()
        
    def stop_monitoring(self) -> None:
        """停止性能监控"""
        self._monitoring = False
        if self._monitor_thread:
            self._monitor_thread.join()
            
    def _monitor_resources(self, interval: float) -> None:
        """监控系统资源使用情况"""
        while self._monitoring:
            try:
                # CPU使用率
                cpu_percent = psutil.cpu_percent(interval=0.1, percpu=True)
                self.metrics['cpu'].append({
                    'timestamp': time.time(),
                    'overall': sum(cpu_percent) / len(cpu_percent),
                    'per_cpu': cpu_percent
                })
                
                # 内存使用
                memory = psutil.Process().memory_info()
                self.metrics['memory'].append({
                    'timestamp': time.time(),
                    'rss': memory.rss,
                    'vms': memory.vms
                })
                
                # 磁盘I/O
                disk_io = psutil.disk_io_counters()
                self.metrics['disk'].append({
                    'timestamp': time.time(),
                    'read_bytes': disk_io.read_bytes,
                    'write_bytes': disk_io.write_bytes
                })
                
                time.sleep(interval)
                
            except Exception as e:
                logger.error(f"Error monitoring resources: {e}")
                
    def record_task(self, task_name: str, duration: float, metadata: Optional[Dict] = None) -> None:
        """记录任务执行时间"""
        self.metrics['tasks'].append({
            'name': task_name,
            'start_time': time.time() - duration,
            'duration': duration,
            'metadata': metadata or {}
        })
        
    def generate_report(self) -> None:
        """生成性能报告"""
        try:
            # 停止监控
            self.stop_monitoring()
            
            # 计算总体指标
            total_duration = time.time() - self.start_time
            task_times = {}
            for task in self.metrics['tasks']:
                name = task['name']
                if name not in task_times:
                    task_times[name] = []
                task_times[name].append(task['duration'])
            
            # 生成报告数据
            report = {
                'timestamp': datetime.now().isoformat(),
                'total_duration': total_duration,
                'task_summary': {
                    name: {
                        'count': len(times),
                        'total_time': sum(times),
                        'average_time': sum(times) / len(times),
                        'min_time': min(times),
                        'max_time': max(times)
                    }
                    for name, times in task_times.items()
                },
                'resource_usage': {
                    'cpu': {
                        'average': sum(m['overall'] for m in self.metrics['cpu']) / len(self.metrics['cpu']),
                        'peak': max(m['overall'] for m in self.metrics['cpu'])
                    },
                    'memory': {
                        'peak_rss': max(m['rss'] for m in self.metrics['memory']),
                        'peak_vms': max(m['vms'] for m in self.metrics['memory'])
                    },
                    'disk': {
                        'total_read': self.metrics['disk'][-1]['read_bytes'] - self.metrics['disk'][0]['read_bytes'],
                        'total_write': self.metrics['disk'][-1]['write_bytes'] - self.metrics['disk'][0]['write_bytes']
                    }
                }
            }
            
            # 保存报告
            report_file = self.metrics_dir / f'report_{int(time.time())}.json'
            report_file.write_text(json.dumps(report, indent=2))
            
            # 生成可视化
            self._generate_visualizations(report)
            
            logger.info(f"Performance report generated: {report_file}")
            
        except Exception as e:
            logger.error(f"Failed to generate performance report: {e}")
            
    def _generate_visualizations(self, report: Dict) -> None:
        """生成性能指标可视化"""
        try:
            # 设置图表样式
            plt.style.use('seaborn')
            
            # CPU使用率趋势
            plt.figure(figsize=(12, 6))
            timestamps = [m['timestamp'] - self.start_time for m in self.metrics['cpu']]
            cpu_usage = [m['overall'] for m in self.metrics['cpu']]
            plt.plot(timestamps, cpu_usage)
            plt.title('CPU Usage Over Time')
            plt.xlabel('Time (seconds)')
            plt.ylabel('CPU Usage (%)')
            plt.savefig(self.metrics_dir / 'cpu_usage.png')
            plt.close()
            
            # 内存使用趋势
            plt.figure(figsize=(12, 6))
            timestamps = [m['timestamp'] - self.start_time for m in self.metrics['memory']]
            memory_usage = [m['rss'] / 1024 / 1024 for m in self.metrics['memory']]  # MB
            plt.plot(timestamps, memory_usage)
            plt.title('Memory Usage Over Time')
            plt.xlabel('Time (seconds)')
            plt.ylabel('Memory Usage (MB)')
            plt.savefig(self.metrics_dir / 'memory_usage.png')
            plt.close()
            
            # 任务执行时间分布
            plt.figure(figsize=(12, 6))
            tasks = list(report['task_summary'].items())
            names = [t[0] for t in tasks]
            times = [t[1]['average_time'] for t in tasks]
            plt.bar(names, times)
            plt.title('Average Task Execution Time')
            plt.xlabel('Task')
            plt.ylabel('Time (seconds)')
            plt.xticks(rotation=45)
            plt.tight_layout()
            plt.savefig(self.metrics_dir / 'task_times.png')
            plt.close()
            
        except Exception as e:
            logger.error(f"Failed to generate visualizations: {e}")

class TaskTimer:
    """任务计时器上下文管理器"""
    
    def __init__(self, monitor: PerformanceMonitor, task_name: str, metadata: Optional[Dict] = None):
        self.monitor = monitor
        self.task_name = task_name
        self.metadata = metadata
        self.start_time = None
        
    def __enter__(self):
        self.start_time = time.time()
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        duration = time.time() - self.start_time
        self.monitor.record_task(self.task_name, duration, self.metadata)

def main():
    """主入口函数"""
    import argparse
    parser = argparse.ArgumentParser(description='Monitor build performance')
    parser.add_argument('output_dir', type=Path, help='Output directory for metrics')
    args = parser.parse_args()
    
    try:
        monitor = PerformanceMonitor(args.output_dir)
        monitor.start_monitoring()
        
        # 示例任务
        with TaskTimer(monitor, 'example_task'):
            time.sleep(2)  # 模拟任务执行
            
        monitor.generate_report()
        
    except Exception as e:
        logger.error(f"Performance monitoring failed: {e}")
        raise SystemExit(1)

if __name__ == '__main__':
    main()
