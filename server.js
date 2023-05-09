const express = require("express");

const app = express();

const { createCanvas, registerFont, deregisterAllFonts } = require("canvas");
const fs = require("fs");
//** image function **
function image(text, userColor, userFont, count) {
  
  registerFont(`${userFont}.otf` || `${userFont}.ttf` || "baravu.otf", { family: "tulu" });



  const canvas = createCanvas(2000, 2000)
  const context = canvas.getContext('2d')
  
  context.fillRect(0, 0, 2000, 2000)
  context.clearRect(0,0,2000,2000)
  
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = userColor;
  
drawMultilineText(
  context,
  text,
  {
      rect: {
          x: 1000,
          y: 0,
          width: 2000,
          height: 2000
      },
      font: 'tulu',
      verbose: true,
      lineHeight: 1,
      minFontSize: 100,
      maxFontSize: 700
  }
)

const buffer = canvas.toBuffer('image/png')
fs.writeFileSync(`./images/${count}.png`, buffer)


  deregisterAllFonts();
  return `https://yourapilink.com/images/${count}.png`;
}



//trial


app.use(express.static(__dirname));

app.get(`/`, (req, res) => {
  var success = true;
  res.json({success})
});

app.get('/image', (req, res) => {
  let text = req.query.text || "tulu";
  text = decodeURIComponent(text)
  let font = req.query.font || "baravu";
  let color = req.query.color || "red";
  fs.readFile("./count.json", (err,data)=>{
    if(err){console.log(err); return}
        data = JSON.parse(data)
        data.count += 1
        fs.writeFile("./count.json", JSON.stringify(data),(err)=>{if(err) console.log(err)})
        fs.rm(`./images/${data.count-5}.png`,(err)=>{if(err)console.log(err)})
        let url = image(text, color, font, data.count);
        res.json({ url });
  })
});



app.listen(process.env.PORT||3000, () => {
  console.log("Server running on port 3000");
});

/* function end */


//image generator function

function drawMultilineText(ctx, text, opts) {

  // Default options
  if (!opts)
      opts = {}
  if (!opts.font)
      opts.font = 'sans-serif'
  if (typeof opts.stroke == 'undefined')
      opts.stroke = false
  if (typeof opts.verbose == 'undefined')
      opts.verbose = false
  if (!opts.rect)
      opts.rect = {
          x: 0,
          y: 0,
          width: ctx.canvas.width,
          height: ctx.canvas.height
      }
  if (!opts.lineHeight)
      opts.lineHeight = 1.1
  if (!opts.minFontSize)
      opts.minFontSize = 30
  if (!opts.maxFontSize)
      opts.maxFontSize = 100
  // Default log function is console.log - Note: if verbose il false, nothing will be logged anyway
  if (!opts.logFunction)
      opts.logFunction = function (message) { console.log(message) }


  const words = text.replace(/\n/g, ' \n ').split(" ").filter((i)=>{return i!=""})
  if (opts.verbose) opts.logFunction('Text contains ' + words.length + ' words')
  var lines = []
  let y;  //New Line

  // Finds max font size  which can be used to print whole text in opts.rec

  
  let lastFittingLines;                       // declaring 4 new variables (addressing issue 3)
  let lastFittingFont;
  let lastFittingY;
  let lastFittingLineHeight;
  for (var fontSize = opts.minFontSize; fontSize <= opts.maxFontSize; fontSize++) {

      // Line height
      var lineHeight = fontSize * opts.lineHeight

      // Set font for testing with measureText()
      ctx.font = ' ' + fontSize + 'px ' + opts.font

      // Start
      var x = opts.rect.x;
      y = lineHeight; //modified line        // setting to lineHeight as opposed to fontSize (addressing issue 1)
      lines = []
      var line = ''
      let wordNotFit = 0
      // Cycles on words

      let oldWord = null
     
      for (var word of words) {
          // Add next word to line
          var linePlus = oldWord || line + word + ' '
          oldWord = null
          // If added word exceeds rect width...
          if (ctx.measureText(linePlus).width > (opts.rect.width)|| word ==="\n") {
            console.log(linePlus.split(" ").filter((i)=>{return i!=""}))
            if(ctx.measureText(linePlus).width > (opts.rect.width) && linePlus.split(" ").filter((i)=>{return i!=""}).length == 1){
              
              wordNotFit = 1
              break
            }
              // ..."prints" (save) the line without last word
              if(line!="")
                lines.push({ text: line, x: x, y: y })
              // New line with ctx last word
              if(word!=="\n"){
                  line = ""
                  oldWord = word
              }else{
                  line = ""
              }
              
              y += lineHeight
          } else {
              // ...continues appending words
              line = linePlus
          }
      }

      // "Print" (save) last line
      lines.push({ text: line, x: x, y: y })

      // If bottom of rect is reached then breaks "fontSize" cycle
          
      if (y > opts.rect.height||wordNotFit) {
        line = ""
        wordNotFit = 0
        break;
      }                                          
          
    
          
      lastFittingLines = lines;               // using 4 new variables for 'step back' (issue 3)
      lastFittingFont = ctx.font;
      lastFittingY = y;
      lastFittingLineHeight = lineHeight;

  }

  lines = lastFittingLines;                   // assigning last fitting values (issue 3)                    
  ctx.font = lastFittingFont;                                                                   
  if (opts.verbose) opts.logFunction("Font used: " + ctx.font);
  const offset = opts.rect.y - lastFittingLineHeight / 2 + (opts.rect.height - lastFittingY) / 2;     // modifying calculation (issue 2)
  for (var line of lines)
      // Fill or stroke
      if (opts.stroke)
          ctx.strokeText(line.text.trim(), line.x, line.y + offset) //modified line
      else
          ctx.fillText(line.text.trim(), line.x, line.y + offset) //modified line

  // Returns font size
  return fontSize
}
