import pathway as pw

def get_version_info(data_stream: pw.Table):
    """
    This replaces the old VersionTracker.
    It extracts the last modification time and path from Pathway's 
    internal metadata to track changes automatically.
    """
    
    # Pathway's _metadata contains: modified_at, created_at, path, etc.
    # We select these to keep a "Live Version" of every file in the engine.
    version_table = data_stream.select(
        file_path=pw.this.path,
        last_modified=pw.this._metadata["modified_at"],
        # We can still keep a hash if you want to track content-specific changes
        content_hash=pw.apply(lambda x: hash(x), pw.this.text) 
    )
    
    # This prints the current 'version' state of your codebase to the console
    # Use this for debugging to see which files Pathway thinks are "new"
    pw.debug.compute_and_print_update_stream(version_table)
    
    return version_table

# 💡 WHY THIS IS BETTER:
# 1. No Manual State: You don't need 'self.latest_hash'. 
#    Pathway remembers the state across the stream.
# 2. Reactive: If you edit 'main.py', this table emits a new row 
#    instantly with the updated 'last_modified' time.