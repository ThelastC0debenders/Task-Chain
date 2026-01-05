# import pathway as pw
# import os
# from pathway_engine.ingestion.loader import load_file

# def watch_local_folder(folder_path: str):
#     print(f"[LOCAL] Initializing live watch on: {folder_path}")
    
#     table = pw.io.fs.read(
#         folder_path,
#         format="binary",
#         mode="streaming",
#         with_metadata=True
#     )

#     return table.select(
#         data=pw.apply(load_file, pw.this.data, pw.this._metadata["path"]),
#         _metadata=pw.this._metadata
#     )

import pathway as pw
import os
from pathway_engine.ingestion.loader import load_file

def watch_local_folder(folder_path: str):
    """
    Watch a local folder for file changes and prepare data for indexing.
    
    Returns a Pathway table with a 'data' column containing formatted text.
    """
    print(f"[LOCAL] 📁 Initializing live watch on: {folder_path}")
    
    # Read files with metadata
    table = pw.io.fs.read(
        folder_path,
        format="binary",
        mode="streaming",
        with_metadata=True
    )
    
    print(f"[LOCAL] 📊 Raw table columns: {table.schema.column_names()}")

    # Transform: Load file content and format it
    # The 'data' column is what VectorStoreServer will index
    processed_table = table.select(
        data=pw.apply(load_file, pw.this.data, pw.this._metadata["path"]),
        _metadata=pw.this._metadata
    )
    
    print(f"[LOCAL] ✅ Processed table columns: {processed_table.schema.column_names()}")
    print(f"[LOCAL] ✅ Local folder watch configured")
    
    return processed_table