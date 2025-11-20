from pathlib import Path
text = Path('components/AppointmentTypesTab.tsx').read_text().splitlines()
for idx, line in enumerate(text, 1):
    if 276 <= idx <= 320:
        print(f"{idx:04d}: {line}")
