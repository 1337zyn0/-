// import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
export class CsvReader {
  constructor(path) {
    this.path = path
  }

  async loadCsvFile(cb) {
    let response = await fetch(this.path);
    let dataResponse = await response.blob();
    let metadata = {
      type: 'text/csv'
    };
    let file = new File([dataResponse], this.path, metadata);

    const reader = new FileReader()

    if (file) {
      reader.onload = () => {
        console.log("| reading sucessful")
        cb(reader.result);
      }
      reader.onerror = (err) => console.log(err)

      console.log("Reading CSV files")
      reader.readAsText(file);
    } else {
      console.log("| Error on reading file")
    }
  }
}

export class JsonReader {
  constructor(path) {
    this._path = path
  }

  readFile(cb, num) {
    fetch(this._path)
      .then((res) => {
        if (!res.ok) {
          throw new Error
            (`HTTP error! Status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        // console.log(data)
        cb(data, num)
      })
      .catch((error) =>
        console.error("Unable to fetch data:", error));
  }
}

/**
 * Adds a given String as tspan elements to a given text element reference
 * @param {*} ref 
 * @param {*} text 
 * @param {*} max_width 
 * @param {*} css_classes 
 */
export function toMultilineText(ref, text, max_width, css_classes, xPadding = 0) {
  const line_height = "1.2em";

  // wrap the text based on how many characters per line
  const text_array = wrapTextArray(text, max_width);
  //console.log(text_array)

  ref
    .selectAll("tspan")
    .data(text_array)
    .enter()
    .append("tspan")
    .text(d => { return d })
    .classed(css_classes, true)
    .attr("x", xPadding)
    .attr("dy", line_height)

  //console.log(ref.node())
}

/**
 * Wrap text into lines depending on characters per line
 * See: https://observablehq.com/@cesare/svg-text-and-tspan-word-wrapping
 * @param {*} text 
 * @param {*} max_width 
 * @returns 
 */
export function wrapTextArray(text, max_width) {
  // split the text around spaces (to get individual words)
  if (!text) return []

  const words = text.split(/\s+/).reverse();

  // define vars to hold individual words, lines, and all lines
  let word,
    lines = [],
    line = [];

  // add words to a line until we exceed the max_width (in characters)
  // when we reach width, add the line to lines and start a new line
  while (word = words.pop()) {
    line.push(word);
    if (line.join(" ").length > max_width) {
      line.pop()
      lines.push(line.join(" "));
      line = [word];
    }
  }
  lines.push(line.join(" "));

  return lines;
}
