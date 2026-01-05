# import pathway as pw

# def load_file(data: bytes, path: str) -> str:
#     """Decodes binary file data to string for indexing."""
#     try:
#         content = data.decode("utf-8", errors="ignore")
#         # ✅ SUCCESS PRINT: Tells you exactly which file entered the engine
#         print(f"[LOADER] Successfully processed: {path}")
#         return content
#     except Exception as e:
#         # ❌ ERROR PRINT: Crucial for knowing if a binary file (like an image) was skipped
#         print(f"[LOADER] Failed to decode {path}: {e}")
#         return ""

# def get_merged_streams(local_table: pw.Table, github_table: pw.Table) -> pw.Table:
#     """Merges your local and github data into one stream."""
#     print("[LOADER] Merging Local and GitHub data streams...")
#     return local_table.concat(github_table)


import os

def load_file(file_data: bytes, file_path: str) -> str:
    """
    Loads and formats file content for indexing.
    
    Returns formatted text with file path header + actual content.
    This is what gets chunked, embedded, and indexed by Pathway.
    """
    try:
        # Decode file content
        content = file_data.decode("utf-8", errors="ignore")
        
        # Skip empty files
        if not content.strip():
            print(f"[LOADER] ⚠️ Empty file: {file_path}")
            return f"# File: {file_path}\n\n[Empty file]"
        
        # 🎯 Format: File path header + content
        # This ensures every chunk contains the source filename
        formatted_content = f"# File: {file_path}\n\n{content}"
        
        # Debug for first few files
        if len(content) < 100:
            print(f"[LOADER] ⚠️ Short file ({len(content)} chars): {file_path}")
        
        return formatted_content
        
    except Exception as e:
        print(f"[LOADER] ❌ Error loading {file_path}: {e}")
        return f"# File: {file_path}\n\n[Error loading file: {str(e)}]"