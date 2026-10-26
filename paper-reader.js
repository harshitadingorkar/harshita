(function () {
  "use strict";

  const book = document.getElementById("book");
  const pageLeft = document.getElementById("content-left");
  const pageRight = document.getElementById("content-right");
  const leaf = document.getElementById("page-leaf");
  const leafFront = document.getElementById("leaf-front");
  const leafBack = document.getElementById("leaf-back");
  const previousButton = document.getElementById("prev");
  const nextButton = document.getElementById("next");
  const pageCount = document.getElementById("page-count");
  const mobileQuery = window.matchMedia("(max-width: 760px)");
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  const pullQuotes = {
    1: "The resulting production was not simply a pre-existing script staged with fewer resources; it was a script and performance being adjusted through those resources.",
    2: "The action itself shows how performance continues by incorporating an event that the prop has made difficult to ignore.",
    3: "When it falls, the relation that helped make that identity is interrupted, and the performer has to construct another route back into the scene.",
    4: "The performer does not first act alone and then use a prop.",
    5: "It is a way to resist explaining the performance through one human intention alone.",
    6: "A weak prop can be treated as an object in the scene and as evidence of the writer’s imagined low-budget production.",
    7: "The wordplay should not blur the distinction, but it can help us remember the argument: the performer was not acting alone, and the prop was not merely waiting to be used."
  };

  let spreads = [];
  let mobilePages = [];
  let spreadIndex = 0;
  let mobileIndex = 0;
  let drag = null;
  let animationTimer = 0;
  let animationHandler = null;
  let animating = false;
  let pendingClickUntil = 0;
  let animationToken = 0;

  function escapeHtml(value) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function inlineMarkup(value) {
    return escapeHtml(value)
      .replace(/\[\^(\d+)\]/g, '<sup class="footnote">$1</sup>')
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>");
  }

  function paragraphsFrom(lines) {
    return lines
      .join("\n")
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
      .filter((paragraph) => paragraph && !paragraph.startsWith("---") && !/^\[\^\d+\]:/.test(paragraph));
  }

  function countWords(value) {
    return (value.match(/[\p{L}\p{N}][\p{L}\p{N}’'-]*/gu) || []).length;
  }

  function splitSentences(paragraph) {
    const sentences = [];
    let start = 0;
    let quoteDepth = 0;
    let parenthesisDepth = 0;

    for (let index = 0; index < paragraph.length; index += 1) {
      const character = paragraph[index];
      if (character === "“") quoteDepth += 1;
      else if (character === "”") quoteDepth = Math.max(0, quoteDepth - 1);
      else if (character === "(") parenthesisDepth += 1;
      else if (character === ")") parenthesisDepth = Math.max(0, parenthesisDepth - 1);
      if (!".!?".includes(character)) continue;

      let end = index + 1;
      let closingQuoteDepth = quoteDepth;
      let closingParenthesisDepth = parenthesisDepth;
      while (end < paragraph.length) {
        const footnote = paragraph.slice(end).match(/^\[\^\d+\]/);
        if (footnote) {
          end += footnote[0].length;
        } else if (paragraph[end] === "”" && closingQuoteDepth > 0) {
          closingQuoteDepth -= 1;
          end += 1;
        } else if (paragraph[end] === ")" && closingParenthesisDepth > 0) {
          closingParenthesisDepth -= 1;
          end += 1;
        } else {
          break;
        }
      }

      if (
        closingQuoteDepth === 0 &&
        closingParenthesisDepth === 0 &&
        (end === paragraph.length || /\s/.test(paragraph[end]))
      ) {
        sentences.push(paragraph.slice(start, end).trim());
        start = end;
        quoteDepth = closingQuoteDepth;
        parenthesisDepth = closingParenthesisDepth;
        index = end - 1;
      }
    }

    if (start < paragraph.length && quoteDepth === 0 && parenthesisDepth === 0) {
      sentences.push(paragraph.slice(start).trim());
    }
    return sentences.filter(Boolean);
  }

  function excerptFrom(paragraphs) {
    const excerpt = [];
    let totalWords = 0;

    excerptLoop: for (const paragraph of paragraphs) {
      const selectedSentences = [];
      for (const sentence of splitSentences(paragraph)) {
        const sentenceWords = countWords(sentence);
        if (totalWords + sentenceWords > 160) {
          if (selectedSentences.length) excerpt.push(selectedSentences.join(" "));
          break excerptLoop;
        }
        selectedSentences.push(sentence);
        totalWords += sentenceWords;
        if (totalWords >= 120) {
          excerpt.push(selectedSentences.join(" "));
          break excerptLoop;
        }
      }
      if (selectedSentences.length) excerpt.push(selectedSentences.join(" "));
    }

    return excerpt.length ? excerpt : paragraphs.slice(0, 1);
  }

  function page(html, kind) {
    return { html, kind: kind || "" };
  }

  function paragraphMarkup(paragraph) {
    return `<p>${inlineMarkup(paragraph)}</p>`;
  }

  function buildSpreads(markdown) {
    const lines = markdown.replace(/\r\n/g, "\n").split("\n");
    const firstSceneIndex = lines.findIndex((line) => /^### Scene \d+:/.test(line));
    if (firstSceneIndex < 0) throw new Error("The paper has no scene headings.");

    const titleLine = lines.find((line) => /^# /.test(line));
    const subtitleLine = lines.find((line) => /^## /.test(line));
    const title = titleLine ? titleLine.replace(/^#\s+/, "").trim() : "The Generative Power of Props";
    const subtitle = subtitleLine ? subtitleLine.replace(/^##\s+/, "").trim() : "";
    const frontNote = paragraphsFrom(lines.slice(0, lines.findIndex((line) => /^# /.test(line))))[0] || "";
    const epigraphLine = lines.slice(0, firstSceneIndex).find((line) => /^>\s*/.test(line));
    const epigraph = epigraphLine ? epigraphLine.replace(/^>\s*/, "").replace(/\[\^(\d+)\]/g, " [$1]") : "";
    const sceneMatches = [];

    lines.forEach((line, index) => {
      const match = line.match(/^### Scene (\d+):\s*(.+)$/);
      if (match) sceneMatches.push({ number: Number(match[1]), title: match[2].trim(), start: index + 1 });
    });

    const result = [];
    result.push({
      left: page("", "blank"),
      right: page(
        `<article class="page-content cover-page"><h1>${inlineMarkup(title)}</h1><p class="cover-subtitle">${inlineMarkup(subtitle)}</p><div class="cover-author">Harshita Shyale</div></article>`,
        "cover"
      )
    });
    result.push({
      left: page(
        `<article class="page-content epigraph-page"><blockquote class="epigraph">${inlineMarkup(epigraph)}</blockquote></article>`,
        "epigraph"
      ),
      right: page(
        `<article class="page-content front-note-page"><p class="front-note">${inlineMarkup(frontNote)}</p></article>`,
        "front-note"
      )
    });

    sceneMatches.forEach((scene, index) => {
      const nextStart = sceneMatches[index + 1] ? sceneMatches[index + 1].start - 1 : lines.length;
      const bodyLines = lines.slice(scene.start, nextStart);
      const endSeparator = bodyLines.findIndex((line) => /^---+$/.test(line.trim()));
      const body = paragraphsFrom(endSeparator < 0 ? bodyLines : bodyLines.slice(0, endSeparator));
      const quote = pullQuotes[scene.number];
      if (!quote || !body.join(" ").includes(quote)) {
        throw new Error(`The pull quote for Scene ${scene.number} is not verbatim in paper.md.`);
      }
      const selected = excerptFrom(body);
      const sceneLabel = String(scene.number).padStart(2, "0");
      result.push({
        left: page(
          `<article class="page-content scene-heading"><div class="scene-number">scene ${sceneLabel}</div><h2 class="scene-title">${inlineMarkup(scene.title)}</h2><blockquote class="pull-quote">${inlineMarkup(quote)}</blockquote></article>`,
          "scene-heading"
        ),
        right: page(
          `<article class="page-content scene-copy">${selected.map(paragraphMarkup).join("")}</article>`,
          "scene-copy"
        )
      });
    });

    result.push({
      left: page(
        `<article class="page-content colophon"><h2 class="colophon-title">${inlineMarkup(title)}</h2><a href="paper-full.html">read the full paper →</a></article>`,
        "colophon"
      ),
      right: page("", "blank")
    });

    return result;
  }

  function flattenedPages() {
    return spreads.flatMap((spread) => [spread.left, spread.right]).filter((item) => item.html);
  }

  function currentPosition() {
    return mobileQuery.matches ? mobileIndex : spreadIndex;
  }

  function pageLimit() {
    return mobileQuery.matches ? mobilePages.length : spreads.length;
  }

  function canTurn(direction) {
    const position = currentPosition();
    return direction === "forward" ? position < pageLimit() - 1 : position > 0;
  }

  function pageContentAt(direction) {
    if (mobileQuery.matches) {
      return mobilePages[mobileIndex + (direction === "forward" ? 1 : -1)];
    }
    if (direction === "forward") return spreads[spreadIndex + 1].left;
    return spreads[spreadIndex - 1].right;
  }

  function setLeafFaces(direction) {
    leaf.classList.toggle("backward", direction === "backward");
    if (mobileQuery.matches) {
      leafFront.innerHTML = mobilePages[mobileIndex].html;
      if (!reducedMotionQuery.matches) {
        const underPageIndex = mobileIndex + (direction === "forward" ? 2 : -2);
        pageRight.innerHTML = mobilePages[underPageIndex] ? mobilePages[underPageIndex].html : "";
      }
    } else {
      const spread = spreads[spreadIndex];
      const nextSpread = spreads[spreadIndex + (direction === "forward" ? 1 : -1)];
      leafFront.innerHTML = direction === "forward" ? spread.right.html : spread.left.html;
      if (!reducedMotionQuery.matches) {
        if (direction === "forward") pageRight.innerHTML = nextSpread.right.html;
        else pageLeft.innerHTML = nextSpread.left.html;
      }
    }
    const nextPage = pageContentAt(direction);
    leafBack.innerHTML = nextPage ? nextPage.html : "";
    leaf.style.setProperty("--turn-shade", "0");
    leaf.style.setProperty("--shade-position", "0%");
    leaf.style.transition = "none";
    leaf.style.transform = "rotateY(0deg)";
    leaf.classList.add("is-visible");
    void leaf.offsetWidth;
  }

  function transformLeaf(progress, direction) {
    const amount = Math.max(0, Math.min(1, progress));
    const curl = Math.sin(Math.PI * amount);
    const angle = (direction === "forward" ? -1 : 1) * 180 * amount;
    const scale = 1 - 0.055 * curl;
    leaf.style.setProperty("--turn-shade", String(curl * 0.82));
    leaf.style.setProperty("--shade-position", `${Math.round(amount * 100)}%`);
    leaf.style.transform = `rotateY(${angle}deg) scaleX(${scale})`;
  }

  function hideLeaf() {
    leaf.classList.remove("is-visible", "backward", "dragging");
    leaf.style.transition = "none";
    leaf.style.transform = "rotateY(0deg)";
    leaf.style.setProperty("--turn-shade", "0");
  }

  function render() {
    const isMobile = mobileQuery.matches;
    book.classList.toggle("single", isMobile);
    if (isMobile) {
      const active = mobilePages[mobileIndex];
      pageLeft.innerHTML = "";
      pageRight.innerHTML = active ? active.html : "";
      pageCount.textContent = `page ${mobileIndex + 1} / ${mobilePages.length}`;
      previousButton.disabled = mobileIndex === 0;
      nextButton.disabled = mobileIndex === mobilePages.length - 1;
    } else {
      const spread = spreads[spreadIndex];
      pageLeft.innerHTML = spread.left.html;
      pageRight.innerHTML = spread.right.html;
      pageCount.textContent = `spread ${spreadIndex + 1} / ${spreads.length}`;
      previousButton.disabled = spreadIndex === 0;
      nextButton.disabled = spreadIndex === spreads.length - 1;
    }
    book.classList.remove("is-crossfading");
    if (reducedMotionQuery.matches) {
      void book.offsetWidth;
      book.classList.add("is-crossfading");
    }
    hideLeaf();
  }

  function clearAnimation() {
    window.clearTimeout(animationTimer);
    if (animationHandler) leaf.removeEventListener("transitionend", animationHandler);
    animationHandler = null;
  }

  function completeAnimation(token, shouldCommit, direction) {
    if (!animating || token !== animationToken) return;
    clearAnimation();
    animating = false;
    if (shouldCommit) {
      if (mobileQuery.matches) mobileIndex += direction === "forward" ? 1 : -1;
      else spreadIndex += direction === "forward" ? 1 : -1;
      render();
    } else {
      render();
    }
  }

  function animateLeaf(target, shouldCommit, direction, fromProgress) {
    if (reducedMotionQuery.matches) {
      const token = ++animationToken;
      animating = true;
      book.classList.add("is-crossfading");
      window.setTimeout(() => completeAnimation(token, shouldCommit, direction), 180);
      return;
    }

    leaf.classList.remove("dragging");
    leaf.style.transition = "none";
    transformLeaf(fromProgress, direction);
    void leaf.offsetWidth;
    leaf.style.transition = "transform 700ms cubic-bezier(.22,1,.36,1)";
    animating = true;
    const token = ++animationToken;
    animationHandler = (event) => {
      if (event.target === leaf && event.propertyName === "transform") {
        completeAnimation(token, shouldCommit, direction);
      }
    };
    leaf.addEventListener("transitionend", animationHandler);
    animationTimer = window.setTimeout(() => completeAnimation(token, shouldCommit, direction), 760);
    requestAnimationFrame(() => transformLeaf(target, direction));
  }

  function turn(direction) {
    if (animating || drag || !canTurn(direction)) return;
    setLeafFaces(direction);
    animateLeaf(1, true, direction, 0);
  }

  function beginDrag(direction, event) {
    if (animating || !canTurn(direction)) return false;
    setLeafFaces(direction);
    leaf.classList.add("dragging");
    drag.direction = direction;
    drag.progress = 0;
    drag.moved = false;
    if (event && event.pointerId !== undefined) {
      try { book.setPointerCapture(event.pointerId); } catch (error) {}
    }
    return true;
  }

  function dragProgress(startX, currentX, direction) {
    const rect = book.getBoundingClientRect();
    const width = mobileQuery.matches ? rect.width : rect.width / 2;
    const delta = direction === "forward" ? startX - currentX : currentX - startX;
    return Math.max(0, Math.min(1, delta / Math.max(width, 1)));
  }

  book.addEventListener("pointerdown", (event) => {
    if (event.target.closest("a, button")) return;
    if (animating || drag) return;
    const rect = book.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const isMobile = mobileQuery.matches;
    const direction = isMobile ? null : (x < rect.width / 2 ? "backward" : "forward");
    const edgeDistance = direction === "backward" ? x : rect.width - x;
    const cornerDistance = Math.min(y, rect.height - y);
    const isTouch = event.pointerType === "touch";
    if (!isTouch && !isMobile && (edgeDistance > 72 || cornerDistance > 86)) return;
    drag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      direction: null,
      progress: 0,
      moved: false
    };
    if (direction && !beginDrag(direction, event)) drag = null;
    else {
      if (!direction) {
        try { book.setPointerCapture(event.pointerId); } catch (error) {}
      }
    }
  });

  book.addEventListener("pointermove", (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const deltaX = event.clientX - drag.startX;
    if (!drag.direction) {
      if (Math.abs(deltaX) < 8) return;
      if (!beginDrag(deltaX < 0 ? "forward" : "backward", event)) {
        drag = null;
        return;
      }
    }
    if (Math.abs(deltaX) > 4) drag.moved = true;
    drag.progress = dragProgress(drag.startX, event.clientX, drag.direction);
    transformLeaf(drag.progress, drag.direction);
  });

  function releaseDrag(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const activeDrag = drag;
    drag = null;
    if (!activeDrag.direction) return;
    if (!activeDrag.moved) {
      render();
      return;
    }
    pendingClickUntil = performance.now() + 280;
    const complete = activeDrag.progress >= 0.5;
    animateLeaf(complete ? 1 : 0, complete, activeDrag.direction, activeDrag.progress);
  }

  book.addEventListener("pointerup", releaseDrag);
  book.addEventListener("pointercancel", releaseDrag);

  book.addEventListener("click", (event) => {
    if (performance.now() < pendingClickUntil || event.target.closest("a, button")) return;
    const rect = book.getBoundingClientRect();
    const x = event.clientX - rect.left;
    turn(x < rect.width / 2 ? "backward" : "forward");
  });

  previousButton.addEventListener("click", () => turn("backward"));
  nextButton.addEventListener("click", () => turn("forward"));

  window.addEventListener("keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      turn("forward");
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      turn("backward");
    }
  });

  function resetForViewport() {
    spreadIndex = 0;
    mobileIndex = 0;
    drag = null;
    animating = false;
    animationToken += 1;
    clearAnimation();
    render();
  }

  mobileQuery.addEventListener("change", resetForViewport);
  reducedMotionQuery.addEventListener("change", render);

  fetch("data/paper.md")
    .then((response) => {
      if (!response.ok) throw new Error(`Could not load paper.md (${response.status}).`);
      return response.text();
    })
    .then((markdown) => {
      spreads = buildSpreads(markdown);
      mobilePages = flattenedPages();
      if (spreads.length !== 10) throw new Error(`Expected 10 paper spreads, found ${spreads.length}.`);
      render();
    })
    .catch((error) => {
      pageRight.innerHTML = `<article class="page-content"><p>${escapeHtml(error.message)}</p></article>`;
      console.error(error);
    });
})();
