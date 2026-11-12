"""把 content/*.md 打包成 js/content-bundle.js（供直接雙擊 index.html 時使用）。"""
import json, pathlib, base64
root = pathlib.Path(__file__).resolve().parent.parent
data = {f"content/{p.name}": p.read_text(encoding="utf-8") for p in sorted((root / "content").glob("*.md"))}
(root / "js" / "content-bundle.js").write_text(
    "/* 自動產生：請編輯 content/*.md 後執行 tools/更新教材.bat */\nwindow.CONTENT = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
assets = {}
for key, fn in [("poster", "poster-sovereign-ai.jpg"), ("couplet", "couplet-ancestral-weave.jpg")]:
    assets[key] = "data:image/jpeg;base64," + base64.b64encode((root / "assets" / fn).read_bytes()).decode()
(root / "js" / "assets-embed.js").write_text("/* 自動產生：3D 家屋海報貼圖 */\nwindow.ASSETS = " + json.dumps(assets) + ";\n", encoding="utf-8")
print("bundled", len(data), "markdown files")
