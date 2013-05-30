//This file adds very basic Markdown support to Neon so that posts can contain links, emphasised text, etc without the need to sanitise HTML input which I can't be bothered to code
package neonserver

import "bytes"

//Takes in some Markdown text and will export it as HTML. Currently aiming to support *, **, _ and []() for simplicity
func MarkdownToHTML(markdown string) string {
	var buffer bytes.Buffer
	emphasisOpen := false
	boldOpen := false
	underscoreOpen := false
	i := 0
	for ;; {
		if markdown[i] == '*' {
			if i < len(markdown) - 1 && markdown[i + 1] == '*' {
				boldOpen = !boldOpen
				if boldOpen {
					buffer.WriteString("<b>")
				} else {
					buffer.WriteString("</b>")
				}
				i += 2
			} else {
				emphasisOpen = !emphasisOpen
				if emphasisOpen {
					buffer.WriteString("<em>")
				} else {
					buffer.WriteString("</em>")
				}
				i++
			}
		} else if markdown[i] == '_' {
			underscoreOpen = !underscoreOpen
			if underscoreOpen {
				buffer.WriteString("<u>")
			} else {
				buffer.WriteString("</u>")
			}
			i++
		} else {
			buffer.WriteByte(markdown[i])
			i++
		}
		
		if i == len(markdown) {
			break
		}
	}
	
	if emphasisOpen {
		buffer.WriteString("</i>")
	}
	if boldOpen {
		buffer.WriteString("</b>")
	}
	if underscoreOpen {
		buffer.WriteString("</u>")
	}
	
	return buffer.String()
}

//TODO Remove all markdown from text
func MarkdownToPlainText(markdown string) string {
	return markdown
}