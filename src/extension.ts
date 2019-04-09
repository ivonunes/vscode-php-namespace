'use strict';

import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    let resolveNamespaceCommand = vscode.commands.registerCommand('extension.resolveNamespace', resolveNamespace);
    context.subscriptions.push(resolveNamespaceCommand);
}

function isCandidate(text: string) {
    return text.startsWith('<?php')
        || text.startsWith('namespace ')
        || text.startsWith('use ');
}

function insertNamespace(editor: vscode.TextEditor, namespace: string) {
    editor.edit(textEdit => {
        let insertAt = null;
        let prependText = '\n';

        for (let line = 0; line < editor.document.lineCount; line++) {
            let text = editor.document.lineAt(line).text;
            
            if (isCandidate(text)) {
                insertAt = line + 1;

                if (text.startsWith('use ')) {
                    prependText = '';
                }
            }
        }

        if (insertAt != null) {
            textEdit.replace(new vscode.Position(insertAt, 0), prependText + 'use ' + namespace + ';\n');
        }
    });
}

function resolveNamespace() {
    let editor = vscode.window.activeTextEditor;
    let document = editor.document;
    let selections = editor.selections;
    
    for (let selection of selections) {
        if (selection.isEmpty) {
            vscode.window.showErrorMessage('Please select a class name.');
        } else {
            const selectedClass = editor.document.getText(selection);
            let searchExts = '**/*.php';
            let excludedFiles = '**/node_modules/**';
            let namespaces = [];
            var regex = /namespace\s+([^;]+);/g;
            
            vscode.workspace.findFiles(searchExts, excludedFiles).then(files => {
                if (files) {
                    files.forEach((file, index, array) => {
                        let fileName = file.fsPath
                            .replace(/^.*[\\\/]/, '')
                            .split('.')[0];
  
                        if (fileName.toLowerCase() == selectedClass.toLowerCase()) {
                            
                            vscode.workspace.openTextDocument(file).then(doc => {
                                for (let line = 0; line < doc.lineCount; line++) {
                                    let textLine = doc.lineAt(line).text;
                                    var res = regex.exec(textLine);

                                    if (res) {

                                        var namespace = res[1] + '\\' + fileName;
             
                                        if (namespaces.indexOf(namespace) == -1) {
                                            namespaces.push(namespace);
                                            insertNamespace(editor, namespace);
                                        }

                                        break;
                                    }
                                }
                            });
                        }
                    });
                }
            });
        }
    }
}
