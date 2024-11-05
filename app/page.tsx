'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Editor, EditorState, ContentState, RichUtils, convertToRaw, convertFromRaw, DraftModel, Modifier } from 'draft-js';
import { v4 as uuidv4 } from 'uuid';
import debounce from 'lodash.debounce';
import 'draft-js/dist/Draft.css';
import InlineToolbar from './components/InlineToolbar';
import ToneDial from './components/ToneDial';

interface Note {
  id: string;
  created: number;
  contents: string; // Serialized Draft.js ContentState
  title: string;
}

const MAIN_TONE_DIAL_ID = 'tone-dial-01-main';

function useIsClient() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted;
}

const NoteEditor: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [editorState, setEditorState] = useState(() => EditorState.createEmpty());
  const [toolbarPosition, setToolbarPosition] = useState<{ top: number; left: number } | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const isClient = useIsClient();

  // Load notes on initial render
  useEffect(() => {
    const loadedNotes: Note[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('note-')) {
        const noteData = JSON.parse(localStorage.getItem(key) || '');
        loadedNotes.push({
          id: key.replace('note-', ''),
          ...noteData
        });
      }
    }

    if (loadedNotes.length > 0) {
      // Sort notes by creation date (newest first)
      loadedNotes.sort((a, b) => b.created - a.created);
      setNotes(loadedNotes);
      selectNote(loadedNotes[0]);
    } else {
      createNewNote();
    }
  }, []);

  const createNewNote = () => {
    const id = uuidv4();
    const newNote: Note = {
      id,
      created: Date.now(),
      contents: JSON.stringify(convertToRaw(ContentState.createFromText(''))),
      title: 'Untitled'
    };

    localStorage.setItem(`note-${id}`, JSON.stringify({
      created: newNote.created,
      contents: newNote.contents,
      title: newNote.title
    }));

    setNotes(prev => [newNote, ...prev]);
    selectNote(newNote);
  };

  const selectNote = (note: Note) => {
    setCurrentNote(note);
    const contentState = convertFromRaw(JSON.parse(note.contents));
    setEditorState(EditorState.createWithContent(contentState));
  };

  const saveNote = useCallback(
    debounce((noteId: string, editorContent: EditorState) => {
      const contentState = editorContent.getCurrentContent();
      const rawContent = convertToRaw(contentState);

      // Extract title from first block
      const blocks = rawContent.blocks;
      const title = blocks.length > 0 ? blocks[0].text || 'Untitled' : 'Untitled';

      // Update local storage
      const noteData = {
        created: currentNote?.created || Date.now(),
        contents: JSON.stringify(rawContent),
        title
      };

      localStorage.setItem(`note-${noteId}`, JSON.stringify(noteData));

      // Update notes state
      setNotes(prev => prev.map(note =>
        note.id === noteId
          ? { ...note, ...noteData }
          : note
      ));

      setCurrentNote(prev => prev ? { ...prev, ...noteData } : null);
    }, 1000),
    [currentNote]
  );

  const handleEditorChange = (newEditorState: EditorState) => {
    setEditorState(newEditorState);
    if (currentNote) {
      saveNote(currentNote.id, newEditorState);
    }
    updateToolbarPosition(newEditorState);
  };

  // Handle keyboard commands (e.g., Cmd+B for bold)
  const handleKeyCommand = (command: string) => {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      handleEditorChange(newState);
      return 'handled';
    }
    return 'not-handled';
  };

  // Auto-bold first line
  const blockStyleFn = (contentBlock: DraftModel.ImmutableData.ContentBlock) => {
    const type = contentBlock.getType();
    if (contentBlock === editorState.getCurrentContent().getBlockMap().first()) {
      return 'header-one';
    }
    return type;
  };
  const updateToolbarPosition = useCallback((currentEditorState: EditorState) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      setToolbarPosition(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const selectionBounds = range.getBoundingClientRect();

    if (selectionBounds.width < 0.1) {
      setToolbarPosition(null);
      return;
    }

    // Check if selection is in the first block (title)
    const currentContent = currentEditorState.getCurrentContent();
    const startKey = currentEditorState.getSelection().getStartKey();
    const firstBlockKey = currentContent.getBlockMap().first().getKey();

    // Don't show toolbar if selection is in title
    if (startKey === firstBlockKey) {
      setToolbarPosition(null);
      return;
    }

    // Check if selection is too close to top of viewport
    const TOOLBAR_HEIGHT = 40;
    const MARGIN = 10;
    const isCloseToTop = selectionBounds.top < (TOOLBAR_HEIGHT + MARGIN);

    setToolbarPosition({
      top: isCloseToTop
        ? selectionBounds.bottom + 10 + TOOLBAR_HEIGHT
        : selectionBounds.top - 10,
      left: selectionBounds.left + (selectionBounds.width / 2),
    });
  }, []);

  const toggleInlineStyle = (inlineStyle: string) => {
    handleEditorChange(
      RichUtils.toggleInlineStyle(editorState, inlineStyle)
    );
  };

  // Create debounced tone select handler
  const debouncedToneSelect = useCallback(
    debounce(async (x: number, y: number, labels: { top: string; right: string; bottom: string; left: string }, currentEditorState: EditorState) => {
      // Get the selected text
      const selection = currentEditorState.getSelection();
      if (selection.isCollapsed()) return; // No text selected

      const currentContent = currentEditorState.getCurrentContent();
      const startKey = selection.getStartKey();
      const startOffset = selection.getStartOffset();
      const endKey = selection.getEndKey();
      const endOffset = selection.getEndOffset();

      let selectedText = '';

      // Get selected text across blocks
      const blockMap = currentContent.getBlockMap();
      let inSelection = false;
      blockMap.forEach((block) => {
        if (!block) return;

        if (block.getKey() === startKey) {
          inSelection = true;
          selectedText += block.getText().slice(startOffset);
        } else if (block.getKey() === endKey) {
          inSelection = false;
          selectedText += block.getText().slice(0, endOffset);
        } else if (inSelection) {
          selectedText += block.getText();
        }

        if (inSelection && block.getKey() !== endKey) {
          selectedText += '\n';
        }
      });

      if (!selectedText) return;

      try {
        const response = await fetch('/api/tone', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: selectedText,
            coordinates: {
              x: (x - 50) / 50, // Normalize to -1 to 1
              y: (y - 50) / 50,
            },
            tones: labels
          })
        });

        if (!response.ok) {
          throw new Error('Failed to adjust tone');
        }

        const { text: newText } = await response.json();

        if (newText) {
          // Replace the text
          const newContentState = Modifier.replaceText(
            currentEditorState.getCurrentContent(),
            selection,
            newText
          );

          // Create a new selection for the replaced text
          const newSelection = selection.merge({
            anchorOffset: selection.getStartOffset(),
            focusOffset: selection.getStartOffset() + newText.length
          });

          // Push the new content and apply the selection
          let newEditorState = EditorState.push(
            currentEditorState,
            newContentState,
            'insert-characters'
          );

          // Force the selection of the new text
          newEditorState = EditorState.forceSelection(newEditorState, newSelection);

          handleEditorChange(newEditorState);
        }
      } catch (error) {
        console.error('Error adjusting tone:', error);
      }
    }, 1000),
    [handleEditorChange]
  );

  // Update handleToneSelect to use the debounced version
  const handleToneSelect = (coordinates: { x: number; y: number }, labels: { top: string; right: string; bottom: string; left: string }) => {
    debouncedToneSelect(coordinates.x, coordinates.y, labels, editorState);
  };

  if (!isClient) return null;

  return (
    <div className="flex h-screen bg-white">
      {/* Left panel - Notes list */}
      <div className="w-64 border-r p-4 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Notes</h2>
          <button
            onClick={createNewNote}
            className="px-2 py-1 text-sm bg-black text-white rounded hover:bg-gray-800"
          >
            New
          </button>
        </div>
        <div className="space-y-2">
          {notes.map(note => (
            <div
              key={note.id}
              onClick={() => selectNote(note)}
              className={`p-2 rounded cursor-pointer hover:bg-gray-100 ${currentNote?.id === note.id ? 'bg-gray-100' : ''
                }`}
            >
              <div className="font-bold truncate">{note.title}</div>
              <div className="text-xs text-gray-500">
                {new Date(note.created).toLocaleDateString()} {new Date(note.created).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Middle panel - Editor */}
      <div className="flex-1 p-4 relative" ref={editorRef}>
        <InlineToolbar
          editorState={editorState}
          onToggle={toggleInlineStyle}
          position={toolbarPosition}
        />
        <div className="prose max-w-none">
          <Editor
            editorState={editorState}
            onChange={handleEditorChange}
            handleKeyCommand={handleKeyCommand}
            blockStyleFn={blockStyleFn}
          />
        </div>
      </div>

      {/* Right panel - Tone Dial */}
      <div className="w-[19rem] border-l p-4 flex flex-col items-center">
        <ToneDial id={MAIN_TONE_DIAL_ID} onToneSelect={handleToneSelect} />
      </div>
    </div>
  );
};

export default NoteEditor;
