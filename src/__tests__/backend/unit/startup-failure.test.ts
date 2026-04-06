import { describe, expect, it } from "vitest";
import { buildStartupFailureDialog, StartupFailure } from "../../../startupFailure";

describe("buildStartupFailureDialog", () => {
  it("formats language catalog suffix conflicts into an actionable startup dialog", () => {
    const dialog = buildStartupFailureDialog(
      new StartupFailure(
        "backend_timeout",
        "Backend did not become ready within 30000ms at http://localhost:6785/problems.",
        'Error: Language catalog has invalid suffixes. Resolve these entries before startup: languages 1 and 2 share suffix "py"; language 3 has an empty suffix.'
      )
    );

    expect(dialog.title).toBe("Language Configuration Error");
    expect(dialog.message).toContain("invalid language suffix configuration");
    expect(dialog.detail).toContain('languages 1 and 2 share suffix "py"');
    expect(dialog.detail).toContain("language 3 has an empty suffix");
    expect(dialog.detail).toContain("ProgrammingLanguage suffix entries");
    expect(dialog.copyText).toContain("Language Configuration Error");
  });

  it("formats backend timeouts with recent backend output", () => {
    const dialog = buildStartupFailureDialog(
      new StartupFailure(
        "backend_timeout",
        "Backend did not become ready within 30000ms at http://localhost:6785/problems.",
        "Error: Cannot find module 'ts-node-dev'\nRequire stack:\n- startup"
      )
    );

    expect(dialog.title).toBe("Backend Startup Timed Out");
    expect(dialog.message).toContain("did not become ready before the startup timeout expired");
    expect(dialog.detail).toContain("Recent backend output");
    expect(dialog.detail).toContain("Cannot find module 'ts-node-dev'");
    expect(dialog.copyText).toContain("Backend Startup Timed Out");
  });

  it("formats backend exit failures distinctly", () => {
    const dialog = buildStartupFailureDialog(
      new StartupFailure(
        "backend_exit",
        "Backend process exited before becoming ready (code=1, signal=none).",
        "Error: boom"
      )
    );

    expect(dialog.title).toBe("Backend Exited During Startup");
    expect(dialog.message).toContain("exited before the app finished starting");
    expect(dialog.detail).toContain("Error: boom");
    expect(dialog.copyText).toContain("Backend Exited During Startup");
  });
});
