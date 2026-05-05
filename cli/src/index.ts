#!/usr/bin/env node
import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { pipelineCommand } from "./commands/pipeline.js";
import { stageCommands } from "./commands/stage.js";
import { brainCommand } from "./commands/brain.js";
import { auditCommand } from "./commands/audit.js";
import { skillsCommand } from "./commands/skills.js";
import { jtbdCommand } from "./commands/jtbd.js";
import { archetypesCommand } from "./commands/archetypes.js";
import { fail } from "./lib/render.js";

async function main(): Promise<void> {
  const program = new Command();
  program
    .name("pdlc")
    .description(
      "pdlc.dev · one brain across Discovery to Support, signed.",
    )
    .version("0.1.0");

  program.addCommand(initCommand());
  program.addCommand(pipelineCommand());
  program.addCommand(brainCommand());
  program.addCommand(auditCommand());
  program.addCommand(skillsCommand());
  program.addCommand(jtbdCommand());
  program.addCommand(archetypesCommand());
  for (const cmd of stageCommands()) program.addCommand(cmd);

  program.showHelpAfterError();

  try {
    await program.parseAsync(process.argv);
  } catch (err) {
    fail((err as Error).message);
    process.exit(1);
  }
}

main();
