// ########## Personal settings ##########
// Set your Notion API Token (strings that starts with `secret_`)
const NOTION_API_TOKEN = "secret_XXXXXXXXXXXXXXXXXXXXXXXX"
// Set your database ID (32-digits hex number)
const DATABASE_ID = "YYYYYYYYYYYYYYYYYYYYYYYYYYY"
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
    "--header 'Notion-Version: 2021-08-16' " +
    "--data '"
  const script = "curl -X " + method + " " + url + header + JSON.stringify(payload).replaceAll("'", '\'"\'"\'') + "'"
  return JSON.parse(app.doShellScript(script))
}

function getNotionPages(app, payload, databaseId) {
  const url = "https://api.notion.com/v1/databases/" + databaseId + "/query"
  return sendNotion(app, url, payload, "POST")
}

function getLastEditedPage(app, databaseId) {
  const payload = {
    sorts: [
      {
        timestamp: "last_edited_time",
        direction: "descending"
      }
    ],
    page_size: 1
  }
  return getNotionPages(app, payload, databaseId)
}

function appendBlockChildren(app, pageId, payload) {
  const url = "https://api.notion.com/v1/blocks/" + pageId + "/children"
  return sendNotion(app, url, payload, "PATCH")
}

function appendCodeBlock(app, page, code, language) {
  if (page) {
    const pageId = page.id
    const payload = {
      children: [
        {
          type: "code",
          object: "block",
          code: {
            text: [
              {
                type: "text",
                text: {
                  content: code
                }
              }
            ],
            language: language
          }
        }
      ]
    }
    const result = appendBlockChildren(app, pageId, payload)
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
      const lastEditedPage = getLastEditedPage(app, DATABASE_ID).results[0]
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