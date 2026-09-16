(() => {
  const footnoteCommand = "\\footnote{";
  const boldCommand = "{\\bf";

  function closingBrace(source, bodyStart) {
    let depth = 1;

    for (let position = bodyStart; position < source.length; position += 1) {
      const character = source[position];

      if (character === "\\" && ["{", "}"].includes(source[position + 1])) {
        position += 1;
        continue;
      }

      if (character === "{") depth += 1;
      if (character === "}") {
        depth -= 1;
        if (depth === 0) return position;
      }
    }

    return -1;
  }

  function renderBoldText(source) {
    let output = "";
    let position = 0;
    let commandStart = source.indexOf(boldCommand, position);

    while (commandStart !== -1) {
      const afterCommand = commandStart + boldCommand.length;
      const boundary = source[afterCommand];

      if (boundary && !/\s/.test(boundary)) {
        output += source.slice(position, afterCommand);
        position = afterCommand;
        commandStart = source.indexOf(boldCommand, position);
        continue;
      }

      output += source.slice(position, commandStart);

      let bodyStart = afterCommand;
      while (/\s/.test(source[bodyStart])) bodyStart += 1;

      const bodyEnd = closingBrace(source, bodyStart);
      if (bodyEnd === -1) {
        output += source.slice(commandStart);
        position = source.length;
        break;
      }

      output += `<strong>${source.slice(bodyStart, bodyEnd).trim()}</strong>`;
      position = bodyEnd + 1;
      commandStart = source.indexOf(boldCommand, position);
    }

    return output + source.slice(position);
  }

  function renderFootnotes(container, postIndex) {
    const source = renderBoldText(container.innerHTML);
    const article = container.closest(".blog-post");
    const prefix = (article?.id || `post-${postIndex + 1}`)
      .replace(/[^a-z0-9-]+/gi, "-");
    const notes = [];
    let output = "";
    let position = 0;
    let commandStart = source.indexOf(footnoteCommand, position);

    while (commandStart !== -1) {
      output += source.slice(position, commandStart);

      const bodyStart = commandStart + footnoteCommand.length;
      const bodyEnd = closingBrace(source, bodyStart);

      if (bodyEnd === -1) {
        output += source.slice(commandStart);
        position = source.length;
        break;
      }

      notes.push(source.slice(bodyStart, bodyEnd).trim());
      const number = notes.length;
      const referenceId = `fnref-${prefix}-${number}`;
      const footnoteId = `fn-${prefix}-${number}`;

      output += `<sup id="${referenceId}" role="doc-noteref">`;
      output += `<a href="#${footnoteId}" class="footnote" rel="footnote" `;
      output += `aria-label="Footnote ${number}">${number}</a></sup>`;

      position = bodyEnd + 1;
      commandStart = source.indexOf(footnoteCommand, position);
    }

    if (notes.length === 0) {
      container.innerHTML = source;
      return;
    }

    output += source.slice(position);
    output += '<div class="footnotes" role="doc-endnotes"><ol>';

    notes.forEach((note, index) => {
      const number = index + 1;
      const referenceId = `fnref-${prefix}-${number}`;
      const footnoteId = `fn-${prefix}-${number}`;

      output += `<li id="${footnoteId}" role="doc-endnote">`;
      output += `<span class="footnote-body">${note}</span>&nbsp;`;
      output += `<a href="#${referenceId}" class="reversefootnote" `;
      output += `role="doc-backlink" aria-label="Back to footnote ${number}">↩</a>`;
      output += "</li>";
    });

    output += "</ol></div>";
    container.innerHTML = output;
  }

  document.querySelectorAll(".blog-post-content").forEach(renderFootnotes);
})();
