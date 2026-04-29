from pathlib import Path
import runpy


ROOT = Path(__file__).resolve().parents[2]
runpy.run_path(str(ROOT / "scripts" / "validate_project.py"), run_name="__main__")
