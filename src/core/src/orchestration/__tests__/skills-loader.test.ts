import path from "node:path"
import { describe, expect, test } from "bun:test"
import { loadSkills } from "../skills/loader.ts"

const fixtures = path.join(import.meta.dir, "..", "skills", "__tests__", "fixtures")

describe("loadSkills", () => {
  test("parses SKILL.md frontmatter", async () => {
    const skills = await loadSkills({ roots: [path.join(fixtures, "project")] })
    const alpha = skills.find((skill) => skill.name === "alpha-skill")

    expect(alpha?.description).toBe("Project alpha skill")
    expect(alpha?.user_invocable).toBe(true)
    expect(alpha?.auto_trigger).toEqual(["alpha", "parse"])
    expect(alpha?.tools).toEqual(["Read", "Grep"])
    expect(alpha?.body).toContain("## Identity")
  })

  test("deduplicates by name before sorting by source", async () => {
    const skills = await loadSkills({
      roots: [path.join(fixtures, "project"), path.join(fixtures, "user")],
    })

    expect(skills.map((skill) => skill.name)).toEqual(["alpha-skill", "beta-skill"])
    expect(skills.find((skill) => skill.name === "alpha-skill")?.description).toBe("Project alpha skill")
    expect(skills.map((skill) => skill.source)).toEqual(
      [...skills.map((skill) => skill.source)].sort((left, right) => left.localeCompare(right)),
    )
  })
})
