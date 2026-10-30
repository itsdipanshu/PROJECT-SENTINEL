import subprocess
import time

modelfile_content = """FROM gemma4:e4b
PARAMETER temperature 0.2
PARAMETER num_ctx 2048
PARAMETER num_predict 350
SYSTEM \"\"\"You are SENTINEL AI, the local emergency intelligence command assistant.
CRITICAL MANDATE: Never write Thinking Process or internal reasoning steps. Start your response immediately with clear, bulleted operational recommendations.\"\"\"
"""

with open("Modelfile.sentinel", "w", encoding="utf-8") as f:
    f.write(modelfile_content)

print("Creating sentinel-fast model...")
cp = subprocess.run(["ollama", "create", "sentinel-fast", "-f", "Modelfile.sentinel"], capture_output=True, text=True)
print("Create code:", cp.returncode, cp.stdout, cp.stderr)

print("Running test query on sentinel-fast...")
t0 = time.time()
res = subprocess.run(
    ["ollama", "run", "sentinel-fast", "--keepalive", "24h"],
    input="Emergency rule: No thinking process. Give 3 immediate evacuation steps for Koshi flood zone.",
    capture_output=True,
    text=True,
    encoding="utf-8"
)
dt = round(time.time() - t0, 2)
print("Execution time (s):", dt)
print("Output:\n", res.stdout)

