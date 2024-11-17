import {RichTextEditor} from "@mantine/tiptap";

export default function Wysiwyg({editor, ...props}) {
    return(
        <RichTextEditor editor={editor} {...props}>
            <RichTextEditor.Toolbar sticky stickyOffset={60}>
                <RichTextEditor.ControlsGroup>
                    <RichTextEditor.Bold/>
                    <RichTextEditor.Italic/>
                    <RichTextEditor.Underline/>
                    <RichTextEditor.Strikethrough/>
                    <RichTextEditor.ClearFormatting/>
                    <RichTextEditor.Highlight/>
                    <RichTextEditor.Code/>
                </RichTextEditor.ControlsGroup>

                <RichTextEditor.ControlsGroup>
                    <RichTextEditor.H1/>
                    <RichTextEditor.H2/>
                    <RichTextEditor.H3/>
                    <RichTextEditor.H4/>
                </RichTextEditor.ControlsGroup>

                <RichTextEditor.ControlsGroup>
                    <RichTextEditor.Blockquote/>
                    <RichTextEditor.Hr/>
                    <RichTextEditor.BulletList/>
                    <RichTextEditor.OrderedList/>
                    <RichTextEditor.Subscript/>
                    <RichTextEditor.Superscript/>
                </RichTextEditor.ControlsGroup>

                <RichTextEditor.ControlsGroup>
                    <RichTextEditor.Link/>
                    <RichTextEditor.Unlink/>
                </RichTextEditor.ControlsGroup>

                <RichTextEditor.ControlsGroup>
                    <RichTextEditor.AlignLeft/>
                    <RichTextEditor.AlignCenter/>
                    <RichTextEditor.AlignJustify/>
                    <RichTextEditor.AlignRight/>
                </RichTextEditor.ControlsGroup>

                <RichTextEditor.ControlsGroup>
                    <RichTextEditor.Undo/>
                    <RichTextEditor.Redo/>
                </RichTextEditor.ControlsGroup>
            </RichTextEditor.Toolbar>

            <RichTextEditor.Content bg="dark.8"/>
        </RichTextEditor>
    )
}