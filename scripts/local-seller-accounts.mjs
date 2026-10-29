// Repository root: ARTBID_TEST_PASSWORD=... node scripts/local-seller-accounts.mjs
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const backendDirectory = fileURLToPath(
  new URL("../../Artbid/", import.meta.url),
);

export async function createLocalSellerAccounts(base, password) {
  const origin = new URL(base);
  if (
    origin.protocol !== "http:" ||
    !["localhost", "127.0.0.1"].includes(origin.hostname) ||
    origin.pathname !== "/" ||
    origin.username ||
    origin.password ||
    origin.search ||
    origin.hash
  ) {
    throw new Error("Only a local HTTP API origin is supported.");
  }
  if (!password || password.length < 8 || password.length > 64)
    throw new Error("ARTBID_TEST_PASSWORD must contain 8–64 characters.");
  const accounts = [];
  const runSql = (sql) =>
    execFileSync(
      "docker",
      [
        "compose",
        "exec",
        "-T",
        "postgres",
        "psql",
        "-U",
        "artbid",
        "-d",
        "artbid",
        "-v",
        "ON_ERROR_STOP=1",
        "-c",
        sql,
      ],
      { cwd: backendDirectory, stdio: "pipe" },
    );
  const cleanup = () => {
    const ids = accounts.map((account) => account.id);
    if (!ids.length) return;
    if (!ids.every(Number.isSafeInteger))
      throw new Error("Invalid cleanup member IDs.");
    // These IDs were returned by signup in this invocation only.
    const emails = accounts.map((account) => `'${account.email}'`).join(",");
    const selection = `id IN (${ids.join(",")}) AND email IN (${emails})`;
    runSql(
      `DELETE FROM seller_profile WHERE member_id IN (SELECT id FROM member WHERE ${selection}); DELETE FROM member WHERE ${selection};`,
    );
  };
  try {
    for (const [label, role] of [
      ["bidder", "BIDDER"],
      ["seller-a", "CONSIGNOR"],
      ["seller-b", "CONSIGNOR"],
    ]) {
      const email = `seller-local-${label}-${randomUUID()}@example.test`;
      const response = await fetch(`${origin.origin}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name:
            role === "BIDDER"
              ? "검증 일반회원"
              : `검증 판매자 ${label.endsWith("a") ? "A" : "B"}`,
        }),
      });
      if (response.status !== 201)
        throw new Error(`Local account signup failed (${response.status}).`);
      const member = await response.json();
      if (!Number.isSafeInteger(member.id))
        throw new Error("Invalid signup member ID.");
      accounts.push({ ...member, role, password });
      if (role === "CONSIGNOR") {
        const changed = runSql(
          `UPDATE member SET role = 'CONSIGNOR' WHERE id = ${member.id} AND email = '${email}' RETURNING id;`,
        ).toString();
        if (!changed.includes("UPDATE 1"))
          throw new Error("The local API and Docker database do not match.");
      }
    }
    return { accounts, cleanup };
  } catch (cause) {
    cleanup();
    throw cause;
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const { accounts } = await createLocalSellerAccounts(
      process.env.ARTBID_TEST_API_ORIGIN ?? "http://127.0.0.1:8080",
      process.env.ARTBID_TEST_PASSWORD,
    );
    console.log(
      "Local accounts created. Use the password supplied through ARTBID_TEST_PASSWORD and log in again after role changes.",
    );
    for (const { email, role } of accounts) console.log(`${role}: ${email}`);
  } catch (cause) {
    console.error(cause.message);
    process.exitCode = 1;
  }
}
