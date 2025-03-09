#!/bin/bash

# Create a temporary file for the new apps list
temp_file=$(mktemp)

# Generate the list of apps
for dir in */; do
    if [ -f "${dir}index.html" ] && [ "$dir" != ".git/" ]; then
        # Extract title from index.html and trim whitespace
        title=$(grep -i "<title>" "${dir}index.html" | sed -e 's/<[^>]*>//g' | tr -d '\n' | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')
        if [ -z "$title" ]; then
            title=${dir%/}  # Use directory name if no title found
        fi
        echo "                <li><a href=\"/${dir%/}\">${title}</a></li>" >> "$temp_file"
    fi
done

# Replace content between <ol> and </ol> tags
sed -i${sed_backup:+' '} -e '/<ol>/,/<\/ol>/{/<ol>/!{/<\/ol>/!d}}' -e "/<ol>/r $temp_file" index.html

# Clean up
rm "$temp_file" 