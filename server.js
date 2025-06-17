const express = require("express");
const app = express();
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();
const { createCanvas, registerFont, deregisterAllFonts } = require("canvas");
const fs = require("fs");
const supabase = createClient(process.env.DB_URL, process.env.DB_KEY);

//** image function **
function image(text, userColor, userFont, count) {
  let fonts = {
    baravu: "baravu.otf",
    allige: "allige.ttf",
    mandara: "mandara.ttf",
  };
  registerFont(
    fonts[userFont] ? `./fonts/${fonts[userFont]}` : `./fonts/baravu.otf`,
    {
      family: "tulu",
    }
  );

  const canvas = createCanvas(2000, 2000);
  const context = canvas.getContext("2d");

  //  context.fillRect(0, 0, 2000, 2000)
  //  context.clearRect(0,0,2000,2000)

  context.textAlign = "center";
  context.textBaseline = "top";
  context.fillStyle = userColor;

  drawMultilineText(context, text, {
    rect: {
      x: 1000,
      y: 0,
      width: 2000,
      height: 2000,
    },
    font: "tulu",
    verbose: true,
    lineHeight: 1.12,
    minFontSize: 10,
    maxFontSize: 700,
    stroke: false,
  });

  const buffer = canvas.toBuffer("image/png");
  if (!fs.existsSync(path.join(process.cwd(), "./images")))
    fs.mkdirSync(path.join(process.cwd(), "./images", { recursive: true }));
  fs.writeFileSync(path.join(process.cwd(), `./images/${count}.png`), buffer, {
    flag: "w+",
  });

  deregisterAllFonts();
  return `${process.env.URL}/images/${count}.png`;
}

app.use(express.static(process.cwd()));

app.get(`/`, (req, res) => {
  res.json({ success: true });
});

app.get("/image", async (req, res) => {
  let text = req.query.text || "tulu";
  text = decodeURIComponent(text);
  let font = req.query.font || "baravu";
  let color = req.query.color || "red";
  let count = 0;
  try {
    count = (await supabase.from("count").select("count").limit(1).single())
      .data.count;
    await supabase
      .from("count")
      .update({ count: count + 1 })
      .eq("id", 0);
  } catch (e) {
    console.log(e);
  }
  count += 1;
  try {
    fs.rm(path.join(process.cwd(), `./images/${count - 5}.png`), (err) => {});
  } catch {}
  let url = image(text, color, font, count);
  res.json({ url });
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running on port 3000");
});

exports.default = app;

/* function end */

//image generator function

function drawMultilineText(ctx, text, opts) {
  let words = text.replace(/\n/g, " \n ").split(" ");
  words = words.filter((i) => {
    return i != "";
  });
  var lines = [];
  let y; //New Line

  // Finds max font size  which can be used to print whole text in opts.rec

  let lastFittingLines; // declaring 4 new variables (addressing issue 3)
  let lastFittingFont;
  let lastFittingY;
  let lastFittingLineHeight;
  let wordNotFit = 0;
  for (
    var fontSize = opts.minFontSize;
    fontSize <= opts.maxFontSize;
    fontSize++
  ) {
    // Line height
    var lineHeight = fontSize * opts.lineHeight;

    // Set font for testing with measureText()
    ctx.font = " " + fontSize + "px " + opts.font;

    // Start
    var x = opts.rect.x;
    y = lineHeight;
    lines = [];
    var line = "";

    // Cycles on words
    for (var word of words) {
      // Add next word to line
      if (ctx.measureText(word).width > opts.rect.width) {
        wordNotFit = 1;
        break;
      }
      var linePlus = line + word + " ";
      // If added word exceeds rect width...
      if (ctx.measureText(linePlus).width > opts.rect.width || word === "\n") {
        // ..."prints" (save) the line without last word
        lines.push({ text: line, x: x, y: y });
        // New line with ctx last word
        if (word !== "\n") {
          line = word + " ";
        } else {
          line = "";
        }

        y += lineHeight;
      } else {
        // ...continues appending words
        line = linePlus;
      }
    }

    // "Print" (save) last line
    lines.push({ text: line, x: x, y: y });

    // If bottom of rect is reached then breaks "fontSize" cycle

    if (y > opts.rect.height || wordNotFit) {
      break;
    }

    lastFittingLines = lines;
    lastFittingFont = ctx.font;
    lastFittingY = y;
    lastFittingLineHeight = lineHeight;
  }

  lines = lastFittingLines;
  //lines = lines.filter(e=>{return e.text!=""})              // assigning last fitting values (issue 3)
  ctx.font = lastFittingFont;
  const offset =
    (opts.rect.height -
      (lines[lines.length - 1].y + lastFittingLineHeight - lines[0].y)) /
    2;
  //const offset = opts.rect.y - lastFittingLineHeight / 2 + (opts.rect.height - lastFittingY) / 2;
  console.log(offset); // modifying calculation (issue 2)
  let i = 0;
  for (var line of lines) {
    // Fill or stroke
    if (opts.stroke) ctx.strokeText(line.text.trim(), line.x, line.y + offset);
    else {
      ctx.fillText(
        line.text.trim(),
        line.x,
        offset + lastFittingLineHeight * i
      );
    }
    i++;
  }

  return fontSize;
}
