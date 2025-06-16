// src/export.js
import { storyState } from "./state.js";

// Function to format story content for export
export function formatStoryContent() {
  const { config, details, history } = storyState;

  let content = `✨ ${details.protagonist.name}'s ${config.template} Adventure ✨\n\n`;
  content += `Generated on ${new Date().toLocaleDateString()}\n\n`;

  // Metadata
  content += `🏰 STORY DETAILS\n`;
  content += `Protagonist: ${details.protagonist.name}, ${details.protagonist.age} year old ${details.protagonist.occupation}\n`;
  content += `Setting: ${details.setting.time} in ${details.setting.location}\n`;
  content += `Conflict: ${details.conflict}\n`;

  if (details.sidekick.name) {
    content += `Sidekick: ${details.sidekick.name} (${details.sidekick.personality})\n`;
  }

  if (details.antagonist.name) {
    content += `Antagonist: ${details.antagonist.name} (${details.antagonist.traits}) - ${details.antagonist.motivation}\n`;
  }

  content += `\n📖 THE STORY\n\n`;

  // Story content
  history.forEach((part, index) => {
    content += `--- Part ${index + 1} ---\n\n`;
    content += `${part}\n\n`;
  });

  content += `\n✨ THE END ✨\n`;
  content += `\nGenerated with AI Story Generator`;

  return content;
}

// Text Export
export function exportToTxt() {
  const content = formatStoryContent();
  const blob = new Blob([content], { type: "text/plain" });
  const filename =
    `${storyState.details.protagonist.name}_Adventure.txt`.replace(
      /[^a-z0-9]/gi,
      "_"
    );

  saveAs(blob, filename);
}

// PDF Export
export function exportToPdf() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // PDF Metadata
  const title = `${storyState.config.template} story about ${storyState.details.protagonist.name}`;
  doc.setDocumentProperties({
    title: title,
    subject: "AI Generated Story",
    author: "AI Story Generator",
  });

  // Title
  doc.setFontSize(16);
  doc.text(title, 105, 15, null, "center");

  // Metadata
  doc.setFontSize(12);
  let yPosition = 25;

  const metadata = [
    `Protagonist: ${storyState.details.protagonist.name}, ${storyState.details.protagonist.age} year old ${storyState.details.protagonist.occupation}`,
    `Setting: ${storyState.details.setting.time} in ${storyState.details.setting.location}`,
    `Conflict: ${storyState.details.conflict}`,
  ];

  if (storyState.details.sidekick.name) {
    metadata.push(
      `Sidekick: ${storyState.details.sidekick.name} (${storyState.details.sidekick.personality})`
    );
  }

  if (storyState.details.antagonist.name) {
    metadata.push(
      `Antagonist: ${storyState.details.antagonist.name} (${storyState.details.antagonist.traits}) - ${storyState.details.antagonist.motivation}`
    );
  }

  metadata.forEach((line) => {
    doc.text(line, 15, yPosition);
    yPosition += 7;
  });

  yPosition += 5;

  // Story content
  doc.setFontSize(12);
  const content = storyState.history.join("\n\n");
  const lines = doc.splitTextToSize(content, 180);

  // Add story parts
  lines.forEach((line) => {
    if (yPosition > 280) {
      doc.addPage();
      yPosition = 20;
    }
    doc.text(line, 15, yPosition);
    yPosition += 7;
  });

  // Save PDF
  doc.save(`${title.replace(/[^a-z0-9]/gi, "_")}.pdf`);
}

// EPUB Export
export function exportToEpub() {
  const title = storyState.details.protagonist.name + "'s Adventure";
  const id = Date.now().toString();

  // Create HTML content
  const content = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <meta charset="UTF-8">
        <style>
          body { font-family: serif; line-height: 1.6; margin: 0 auto; max-width: 800px; padding: 20px; }
          h1 { text-align: center; }
          .part { margin-bottom: 40px; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        ${storyState.history
          .map(
            (part, index) => `
          <div class="part">
            <h2>Part ${index + 1}</h2>
            <p>${part.replace(/\n/g, "</p><p>")}</p>
          </div>
        `
          )
          .join("")}
      </body>
    </html>
  `;

  // Create EPUB structure
  const zip = new JSZip();

  // Required EPUB files
  zip.file("mimetype", "application/epub+zip");

  const metaInf = zip.folder("META-INF");
  metaInf.file(
    "container.xml",
    `
    <?xml version="1.0"?>
    <container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
      <rootfiles>
        <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
      </rootfiles>
    </container>
  `
  );

  const oebps = zip.folder("OEBPS");
  oebps.file(
    "content.opf",
    `
    <?xml version="1.0" encoding="UTF-8"?>
    <package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid">
      <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
        <dc:identifier id="bookid">urn:uuid:${id}</dc:identifier>
        <dc:title>${title}</dc:title>
        <dc:creator>AI Story Generator</dc:creator>
        <dc:language>${storyState.config.language}</dc:language>
        <meta property="dcterms:modified">${new Date().toISOString()}</meta>
      </metadata>
      <manifest>
        <item id="toc" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
        <item id="content" href="content.xhtml" media-type="application/xhtml+xml"/>
      </manifest>
      <spine toc="toc">
        <itemref idref="content"/>
      </spine>
    </package>
  `
  );

  oebps.file(
    "toc.ncx",
    `
    <?xml version="1.0" encoding="UTF-8"?>
    <ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
      <head>
        <meta name="dtb:uid" content="urn:uuid:${id}"/>
      </head>
      <docTitle>
        <text>${title}</text>
      </docTitle>
      <navMap>
        <navPoint id="start" playOrder="1">
          <navLabel><text>Beginning</text></navLabel>
          <content src="content.xhtml"/>
        </navPoint>
      </navMap>
    </ncx>
  `
  );

  oebps.file("content.xhtml", content);

  // Generate and download EPUB
  zip.generateAsync({ type: "blob" }).then((blob) => {
    const filename = `${title.replace(/[^a-z0-9]/gi, "_")}.epub`;
    saveAs(blob, filename);
  });
}
