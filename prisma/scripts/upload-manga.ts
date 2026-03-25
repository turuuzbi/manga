import fs from "fs";
import path from "path";
import prisma from "../../lib/db";
import { uploadToR2 } from "../../lib/r2";

const folder = "./manga/chapter1";

async function main() {
  const files = fs.readdirSync(folder).sort();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const buffer = fs.readFileSync(path.join(folder, file));

    const key = `manga/1/chapter/1/${i + 1}.jpg`;

    const { url } = await uploadToR2(buffer, key);

    await prisma.page.create({
      data: {
        chapterId: "your-chapter-id",
        pageNumber: i + 1,
        imageUrl: url,
      },
    });
  }
}

main();
