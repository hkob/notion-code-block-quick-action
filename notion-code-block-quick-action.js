// ########## Personal settings ##########
// Set your Notion API Token (strings that starts with `ntn_` or `secret_`)
const NOTION_API_TOKEN = "secret_XXXXXXXXXXXXXXXXXXXXXXXX"
// Set default language
const DEFAULT_LANGUAGE = "shell"
// If you want to open a new task by Notion.app, set true.  If you want to open it by your default browser, set false.
const OPEN_BY_APP = true
// Available languages
const languages = [
      "abap", "arduino", "bash", "basic", "c", "clojure", "coffeescript", "c++", "c#", "css", "dart", "diff", "docker",
      "elixir", "elm", "erlang", "flow", "fortran", "f#", "gherkin", "glsl", "go", "graphql", "groovy", "haskell", "html",
      "java", "javascript", "json", "julia", "kotlin", "latex", "less", "lisp", "livescript", "lua", "makefile", "markdown",
      "markup", "matlab", "mermaid", "nix", "objective-c", "ocaml", "pascal", "perl", "php", "plain text", "powershell",
      "prolog", "protobuf", "python", "r", "reason", "ruby", "rust", "sass", "scala", "scheme", "scss", "shell", "sql",
      "swift", "typescript", "vb.net", "verilog", "vhdl", "visual basic", "webassembly", "xml", "yaml", "java/c/c++/c#"
    ]

// show a dialog to register dateTimeStr
function dialogText(app, input) {
  const message = "Input language \n" +
    " Example: (no input) -> " + DEFAULT_LANGUAGE + "\n Available: " +
    languages.join(", ") + "\n for Message : \n" + input
  return app.displayDialog(message, {
    defaultAnswer: "",
    withIcon: "note",
    buttons: ["Cancel", "Continue"],
    defaultButton: "Continue"
  })
}

// Call Notion API
function sendNotion(app, url, payload, method) {
  const header = " --header 'Authorization: Bearer '" + NOTION_API_TOKEN + "'' "  +
    "--header 'Content-Type: application/json' " +
    "--header 'Notion-Version: 2022-06-28' " +
    "--data '"
  const script = "curl -X " + method + " " + url + header + payload.replaceAll("'", '\'"\'"\'') + "'"
  return JSON.parse(app.doShellScript(script))
}

function getNotionPages(app, payload) {
  const url = "https://api.notion.com/v1/search"
  return sendNotion(app, url, payload, "POST")
}

function getLastEditedPage(app) {
  const payload = {
    sort: {
      timestamp: "last_edited_time",
      direction: "descending"
    },
    page_size: 1
  }
  return getNotionPages(app, JSON.stringify(payload))
}

function appendBlockChildren(app, pageId, payload) {
  const url = "https://api.notion.com/v1/blocks/" + pageId + "/children"
  return sendNotion(app, url, payload, "PATCH")
}

function appendCodeBlock(app, page, code, language) {
  if (page) {
    const pageId = page.id
    let texts = []
    for (let i = 0; i < code.length; i+=1990) {
      texts.push({type: "text", text: {content: code.slice(i, i+1990)}})
    }
    const payload = {
      children: [
        {
          type: "code",
          object: "block",
          code: {
            rich_text: texts,
            language: language
          }
        }
      ]
    }
    const result = appendBlockChildren(app, pageId, JSON.stringify(payload))
    return result.url
  } else {
    return null
  }
}

function run(input, parameters) {
  const app = Application.currentApplication()
  app.includeStandardAdditions = true

  if (input.length > 0) {
    const inputStr = String(input)
    three_lines = inputStr.match("^[^\n]+\n[^\n]+\n[^\n]+") || inputStr
    const response = dialogText(app, three_lines)
    if (response.buttonReturned == "Continue") {
      var language = response.textReturned
      if (languages.indexOf(language) == -1) {
        language = "shell"
      }
      const lastEditedPage = getLastEditedPage(app).results[0]
      appendCodeBlock(app, lastEditedPage, inputStr, language)
      var url = lastEditedPage.url
      if (OPEN_BY_APP == true) {
        url = url.replace("https", "notion")
        let notion = Application("Notion")
        notion.activate()
      }
    }
    return url
  } else {
    return false
  }
}
