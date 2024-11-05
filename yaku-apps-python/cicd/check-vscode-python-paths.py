import json
import subprocess
from pathlib import Path

settings_file = Path(".vscode/settings.json")
pants_roots = subprocess.check_output(["pants", "roots", "--sep=:"], encoding="utf-8")
settings = json.loads(settings_file.read_text())
settings["python.analysis.extraPaths"] = list(filter(None, pants_roots.split(":")))
settings_file.write_text(json.dumps(settings, indent=2))
