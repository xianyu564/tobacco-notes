param(
  [Parameter(Mandatory=$true)][ValidateSet('cigars','cigarettes','pipe','ryo','snus','ecig')] [string]$category,
  [Parameter(Mandatory=$true)] [string]$title,
  [string]$date
)

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$python = 'python'
$args = @('tools/new_note.py', $category, $title)
if ($date) { $args += @('--date', $date) }
Push-Location $root
try {
  & $python @args
} finally {
  Pop-Location
}

