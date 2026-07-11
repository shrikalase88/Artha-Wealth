with open("app/(dashboard)/dashboard/dashboard-view.tsx", "r") as f:
    lines = f.readlines()

# The component ends at line 1229 with '}\n'. 
# Let's find the last '}\n' that matches the component end.
end_idx = 0
for i in range(len(lines)):
    if lines[i] == "}\n" and "ManualAssetModal" in "".join(lines[i-15:i]):
        end_idx = i
        break

if end_idx != 0:
    lines = lines[:end_idx + 1]

with open("app/(dashboard)/dashboard/dashboard-view.tsx", "w") as f:
    f.writelines(lines)
