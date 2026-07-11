with open("app/(dashboard)/dashboard/dashboard-view.tsx", "r") as f:
    content = f.read()

# We want to move the closing div from line 1121 to after the currency block (before ManualAssetModal)
# Let's replace the one right before TAB 4 with nothing
content = content.replace("        )}\n      </div>\n\n\n        {/* -------------------- TAB 4: CURRENCY -------------------- */}", "        )}\n\n        {/* -------------------- TAB 4: CURRENCY -------------------- */}")
# Let's replace the one right before TAB 4 with nothing (in case of different newlines)
content = content.replace("      </div>\n\n\n        {/* -------------------- TAB 4: CURRENCY -------------------- */}", "\n        {/* -------------------- TAB 4: CURRENCY -------------------- */}")

# And add a closing div before ManualAssetModal
content = content.replace("      {/* Manual Input modal dialog */}", "      </div>\n\n      {/* Manual Input modal dialog */}")

with open("app/(dashboard)/dashboard/dashboard-view.tsx", "w") as f:
    f.write(content)
