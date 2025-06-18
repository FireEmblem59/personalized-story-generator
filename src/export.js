// src/export.js
import { storyState } from "./state.js";

/**
 * A flexible function to format story content for export from either the
 * Guided Generator (storyState) or the Chapter View (storyObject).
 * @param {object} [storyObject] - The full story object from the Chapter View. If not provided, uses global storyState.
 * @returns {string} The formatted story content as a single string.
 */

// Function to format story content for export
function formatStoryContent(storyObject) {
  const storyData = storyObject || storyState;
  const title =
    storyData.title || `${storyData.details?.protagonist?.name}'s Adventure`;
  const details = storyData.details || {};
  const chapters =
    storyData.chapters ||
    (storyData.history
      ? [{ title: "The Story", content: storyData.history.join("\n\n") }]
      : []);

  let content = `✨ ${title} ✨\n`;
  content += `Generated on ${new Date().toLocaleDateString()}\n\n`;

  // Metadata from details if they exist
  if (details.protagonist?.name) {
    content += `--- STORY DETAILS ---\n`;
    content += `Protagonist: ${details.protagonist.name}`;
    if (details.protagonist.age)
      content += `, ${details.protagonist.age} years old`;
    if (details.protagonist.occupation)
      content += `, ${details.protagonist.occupation}`;
    content += `\n`;

    if (details.setting?.location) {
      content += `Setting: ${details.setting.time || "an unknown time"} in ${
        details.setting.location
      }\n`;
    }
    if (details.conflict) {
      content += `Conflict: ${details.conflict}\n`;
    }
    content += `\n`;
  }

  content += `--- STORY CONTENT ---\n\n`;

  // Story chapters
  chapters.forEach((chapter) => {
    content += `--- ${chapter.title} ---\n\n`;
    content += `${chapter.content}\n\n`;
  });

  content += `\n✨ THE END ✨\n`;

  return content;
}

/**
 * Exports a story to a TXT file.
 * @param {object} [storyObject] - The story object to export. Defaults to global storyState.
 */
export function exportToTxt(storyObject) {
  const content = formatStoryContent(storyObject);
  const storyData = storyObject || storyState;
  const title =
    storyData.title || `${storyData.details.protagonist.name}'s Adventure`;
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const filename = `${title.replace(/[^a-z0-9]/gi, "_")}.txt`;
  saveAs(blob, filename);
}

/**
 * Exports a story to a PDF file.
 * @param {object} [storyObject] - The story object to export. Defaults to global storyState.
 */
export function exportToPdf(storyObject) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const storyData = storyObject || storyState;

  const title =
    storyData.title || `${storyData.details.protagonist.name}'s Adventure`;
  const details = storyData.details || {};
  const chapters =
    storyData.chapters ||
    (storyData.history
      ? [{ title: "The Story", content: storyData.history.join("\n\n") }]
      : []);

  // PDF Metadata
  doc.setDocumentProperties({
    title: title,
    subject: "AI Generated Story",
    author: "AI Story Weaver",
  });

  // Main Title
  doc.setFontSize(22);
  doc.text(title, 105, 20, { align: "center" });

  let yPosition = 35;

  // Story Details Section
  if (details.protagonist?.name) {
    doc.setFontSize(10);
    doc.setTextColor(100);
    const metadata = [
      `Protagonist: ${details.protagonist.name}`,
      `Setting: ${details.setting.location || "Unknown"}`,
      `Conflict: ${details.conflict || "An unknown challenge"}`,
    ];
    doc.text(metadata.join(" | "), 105, yPosition, { align: "center" });
    yPosition += 15;
  }

  // Chapters
  chapters.forEach((chapter) => {
    if (yPosition > 260) {
      doc.addPage();
      yPosition = 20;
    }
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text(chapter.title, 15, yPosition);
    yPosition += 10;

    doc.setFontSize(12);
    const lines = doc.splitTextToSize(chapter.content, 180);
    lines.forEach((line) => {
      if (yPosition > 280) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, 15, yPosition);
      yPosition += 7;
    });
    yPosition += 10; // Space between chapters
  });

  doc.save(`${title.replace(/[^a-z0-9]/gi, "_")}.pdf`);
}

/**
 * Exports a story to an EPUB file.
 * @param {object} [storyObject] - The story object to export. Defaults to global storyState.
 */
export function exportToEpub(storyObject) {
  const storyData = storyObject || storyState;
  const title =
    storyData.title || `${storyData.details.protagonist.name}'s Adventure`;
  const language = storyData.language || "en";
  const chapters =
    storyData.chapters ||
    (storyData.history
      ? [{ title: "The Story", content: storyData.history.join("\n\n") }]
      : []);
  const id = Date.now().toString();

  // Create HTML content for the EPUB body
  const content = `
    <!DOCTYPE html>
    <html xmlns="http://www.w3.org/1999/xhtml" xml:lang="${language}">
      <head>
        <title>${title}</title>
        <meta charset="UTF-8"/>
        <style>
          body { font-family: serif; line-height: 1.6; }
          h1, h2 { text-align: center; }
          .chapter { page-break-before: always; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        ${chapters
          .map(
            (chapter, index) => `
          <div class="chapter">
            <h2>${chapter.title}</h2>
            <p>${chapter.content.replace(/\n/g, "</p><p>")}</p>
          </div>
        `
          )
          .join("")}
      </body>
    </html>
  `;

  // Create EPUB structure
  const zip = new JSZip();
  zip.file("mimetype", "application/epub+zip");
  const metaInf = zip.folder("META-INF");
  metaInf.file(
    "container.xml",
    `<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`
  );
  const oebps = zip.folder("OEBPS");
  oebps.file(
    "content.opf",
    `<?xml version="1.0" encoding="UTF-8"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="bookid">urn:uuid:${id}</dc:identifier><dc:title>${title}</dc:title><dc:creator>AI Story Weaver</dc:creator><dc:language>${language}</dc:language><meta property="dcterms:modified">${new Date().toISOString()}</meta></metadata><manifest><item id="toc" href="toc.xhtml" media-type="application/xhtml+xml" properties="nav"/><item id="content" href="content.xhtml" media-type="application/xhtml+xml"/></manifest><spine><itemref idref="content"/></spine></package>`
  );
  oebps.file(
    "toc.xhtml",
    `<?xml version="1.0" encoding="UTF-8"?><html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><head><title>Table of Contents</title></head><body><nav epub:type="toc"><ol>${chapters
      .map(
        (chapter, index) =>
          `<li><a href="content.xhtml#chap${index}">${chapter.title}</a></li>`
      )
      .join("")}</ol></nav></body></html>`
  );
  oebps.file(
    "content.xhtml",
    content.replace(
      /<div class="chapter">/g,
      (match, offset, string) =>
        `<div class="chapter" id="chap${
          (string.substring(0, offset).match(/<div class="chapter"/g) || [])
            .length
        }">`
    )
  );

  zip.generateAsync({ type: "blob" }).then((blob) => {
    const filename = `${title.replace(/[^a-z0-9]/gi, "_")}.epub`;
    saveAs(blob, filename);
  });
}
