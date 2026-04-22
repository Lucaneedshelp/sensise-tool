// Assuming the filename-input is an input element with id 'filename-input'
function downloadJSON(data) {
    const filenameInput = document.getElementById('filename-input').value;
    let filename = filenameInput.trim();

    // Append .json extension if not present
    if (!filename.endsWith('.json')) {
        filename += '.json';
    }

    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}