import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createLocalSellerAccounts } from "./local-seller-accounts.mjs";

const backendDirectory = fileURLToPath(
  new URL("../../Artbid/", import.meta.url),
);
const sql = (statement) =>
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
      statement,
    ],
    { cwd: backendDirectory, stdio: "pipe" },
  );

export async function createLocalAdminReviewFixtures(
  base,
  password,
  count = 2,
  imageUrl = null,
) {
  if (!Number.isSafeInteger(count) || count < 2 || count > 25)
    throw new Error("Fixture count must be 2–25.");
  // The shared provisioner rejects non-local origins and only changes newly signed-up accounts.
  const fixture = await createLocalSellerAccounts(base, password);
  const [bidder, seller, admin] = fixture.accounts;
  let artistId;
  const artistName = `심사 검증 작가 ${randomUUID().slice(0, 8)}`;
  const artworks = [];
  const cleanup = () => {
    if (artworks.length) {
      const ids = artworks.map((artwork) => artwork.id);
      if (!ids.every(Number.isSafeInteger) || !Number.isSafeInteger(artistId))
        throw new Error("Invalid artwork cleanup IDs.");
      const selection = `id IN (${ids.join(",")}) AND artist_id = ${artistId} AND consignor_id = ${seller.id}`;
      sql(
        `DELETE FROM artwork_media WHERE artwork_id IN (SELECT id FROM artwork WHERE ${selection}); DELETE FROM artwork WHERE ${selection};`,
      );
    }
    if (Number.isSafeInteger(artistId))
      sql(
        `DELETE FROM artist WHERE id = ${artistId} AND name = '${artistName}';`,
      );
    fixture.cleanup();
  };
  const post = async (endpoint, body) => {
    const response = await fetch(`${base}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (response.status !== 201)
      throw new Error(`Local fixture request failed (${response.status}).`);
    const result = await response.json();
    if (!Number.isSafeInteger(result.id))
      throw new Error("Invalid fixture response ID.");
    return result;
  };
  try {
    const changed = sql(
      `UPDATE member SET role = 'ADMIN' WHERE id = ${admin.id} AND email = '${admin.email}' RETURNING id;`,
    ).toString();
    if (!changed.includes("UPDATE 1"))
      throw new Error("The local API and Docker database do not match.");
    admin.role = "ADMIN";
    const artist = await post("/api/artists", {
      name: artistName,
      biography: "자동 검증용 합성 작가",
      nationality: "대한민국",
    });
    artistId = artist.id;
    for (let index = 0; index < count; index += 1) {
      artworks.push(
        await post("/api/artworks", {
          consignorId: seller.id,
          artistId,
          title: `심사 검증 작품 ${String(index + 1).padStart(2, "0")}`,
          description:
            "실제 사용자 작품과 분리해 만든 로컬 심사 검증용 데이터입니다.",
          category: "PAINTING",
          medium: "캔버스에 아크릴",
          widthCm: 60,
          heightCm: 80,
          productionYear: 2026,
          startPrice: 150000,
          estimatedPrice: 300000,
          imageUrl,
        }),
      );
    }
    return { accounts: [bidder, seller, admin], artworks, artistId, cleanup };
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
    const fixture = await createLocalAdminReviewFixtures(
      process.env.ARTBID_TEST_API_ORIGIN ?? "http://127.0.0.1:8080",
      process.env.ARTBID_TEST_PASSWORD,
    );
    console.log(
      "Local review fixtures created. Log in using the password supplied through ARTBID_TEST_PASSWORD.",
    );
    for (const { email, role } of fixture.accounts)
      console.log(`${role}: ${email}`);
    for (const artwork of fixture.artworks)
      console.log(`Review artwork ID: ${artwork.id}`);
  } catch (cause) {
    console.error(cause.message);
    process.exitCode = 1;
  }
}
