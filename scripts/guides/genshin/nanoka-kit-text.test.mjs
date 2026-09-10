import assert from "node:assert/strict";
import test from "node:test";
import { cleanKitDescription, cleanCharacterKitPublicFields } from "./nanoka-kit-text.mjs";

test("unwraps LINK macros to inner skill names", () => {
  assert.equal(
    cleanKitDescription("Elemental Skill {LINK#S11122}Low-Temperature Cooking{/LINK} deals Cryo DMG."),
    "Elemental Skill Low-Temperature Cooking deals Cryo DMG.",
  );
  assert.equal(
    cleanKitDescription("{LINK#N11120001}Cold Storage Mode{/LINK}"),
    "Cold Storage Mode",
  );
});

test("removes TIMEZONE and leftover control macros", () => {
  assert.equal(cleanKitDescription("Resets at {TIMEZONE} daily."), "Resets at daily.");
  assert.equal(cleanKitDescription("Keep 20% ATK and names."), "Keep 20% ATK and names.");
});

test("converts literal encoded newlines into real line breaks", () => {
  const cleaned = cleanKitDescription("Line one.\\n\\nTap\\nActivates the skill.");
  assert.equal(cleaned, "Line one.\n\nTap\nActivates the skill.");
  assert.equal(cleaned.includes("\\n"), false);
});

test("still prefers PC layout hint text", () => {
  assert.equal(
    cleanKitDescription("{LAYOUT_MOBILE#Tap}{LAYOUT_PC#Press}{LAYOUT_PS#Press} to attack."),
    "Press to attack.",
  );
});

test("cleans public description but preserves rawDescription", () => {
  const kit = cleanCharacterKitPublicFields({
    elemental_skill: {
      name: "Skill",
      description: "dirty",
      rawDescription: "Use {LINK#S11122}Low-Temperature Cooking{/LINK}.\\nTap",
    },
    passive_talents: [
      {
        name: "P1",
        description: "x",
        rawDescription: "{LINK#N11120001}Cold Storage Mode{/LINK} at {TIMEZONE}",
      },
    ],
  });

  assert.equal(kit.elemental_skill.description, "Use Low-Temperature Cooking.\nTap");
  assert.equal(
    kit.elemental_skill.rawDescription,
    "Use {LINK#S11122}Low-Temperature Cooking{/LINK}.\\nTap",
  );
  assert.equal(kit.passive_talents[0].description, "Cold Storage Mode at");
  assert.match(kit.passive_talents[0].rawDescription, /\{LINK#/);
});
