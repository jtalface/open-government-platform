import { NextRequest, NextResponse } from "next/server";
import { join, sep } from "path";

export async function GET(_req: NextRequest) {
  const cwd = process.cwd();
  const baseDir = __dirname;
  const appsWebSegment = `${sep}apps${sep}web`;

  const idxFromBase = baseDir.lastIndexOf(appsWebSegment);
  const appRootFromBase =
    idxFromBase !== -1 ? baseDir.slice(0, idxFromBase + appsWebSegment.length) : null;

  const appRoot =
    appRootFromBase ??
    (cwd.includes(appsWebSegment)
      ? cwd.slice(0, cwd.lastIndexOf(appsWebSegment) + appsWebSegment.length)
      : cwd);

  return NextResponse.json({
    cwd,
    __dirname: baseDir,
    appRoot,
    uploadsDir: join(appRoot, "public", "uploads", "incidents"),
  });
}

