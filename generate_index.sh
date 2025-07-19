#!/bin/bash

# Create temporary files for the new apps lists
temp_file_apps=$(mktemp)

echo "Generating General Apps section..."

# Generate the list of General Apps (existing functionality)
for dir in */; do
    if [ -f "${dir}index.html" ] && [ "$dir" != ".git/" ]; then
        # Extract title from index.html and trim whitespace
        title=$(grep -i "<title>" "${dir}index.html" | sed -e 's/<[^>]*>//g' | tr -d '\n' | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')
        if [ -z "$title" ]; then
            title=${dir%/}  # Use directory name if no title found
        fi
        echo "                        <li><a href=\"/${dir%/}\">${title}</a></li>" >> "$temp_file_apps"
    fi
done

echo "Generating Other Apps section..."

# Generate the list of Other Apps from other-apps-repo.txt
if [ -f "other-apps-repo.txt" ]; then
    while IFS= read -r repo_url; do
        # Skip empty lines
        if [ -z "$repo_url" ]; then
            continue
        fi
        
        echo "Processing repo: $repo_url"
        
        # Extract username and repo name from URL
        repo_info=$(echo "$repo_url" | sed 's|https://github.com/||')
        username=$(echo "$repo_info" | cut -d'/' -f1)
        repo_name=$(echo "$repo_info" | cut -d'/' -f2)
        branch=$(echo "$repo_info" | cut -d'/' -f4)
        
        # Try to fetch CNAME file (try main branch first, then master)
        dns_name=""
        cname_content=$(curl -s "https://raw.githubusercontent.com/$username/$repo_name/$branch/CNAME" 2>/dev/null)
        if [ $? -ne 0 ] || [ -z "$cname_content" ]; then
            cname_content=$(curl -s "https://raw.githubusercontent.com/$username/$repo_name/master/CNAME" 2>/dev/null)
        fi
        
        if [ -n "$cname_content" ] && [ "$cname_content" != "404: Not Found" ]; then
            dns_name=$(echo "$cname_content" | tr -d '\n' | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')
        fi
        
        # Try to fetch index.html file from the provided URL
        title=""
        raw_html_url=$(echo "$repo_url" | sed 's|github.com|raw.githubusercontent.com|' | sed 's|/blob/|/|')
        html_content=$(curl -sL "$raw_html_url" 2>/dev/null)

        if [ -n "$html_content" ] && [ "$html_content" != "404: Not Found" ]; then
            title=$(echo "$html_content" | grep -i "<title>" | sed -e 's/<[^>]*>//g' | tr -d '\n' | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')
        fi
        
        # Use repo name as fallback title
        if [ -z "$title" ]; then
            title="$repo_name"
        fi
        
        # Use HTTPS URL with DNS name if available, otherwise use GitHub Pages URL
        path_in_repo=$(echo "$repo_url" | sed -n 's|https://github.com/[^/]*/[^/]*/blob/[^/]*/\(.*\)/index.html|\1|p')
        
        if [ -n "$dns_name" ]; then
            url="https://$dns_name"
        else
            base_url="https://$username.github.io/$repo_name"
            if [ -n "$path_in_repo" ]; then
                url="$base_url/$path_in_repo/"
            else
                url="$base_url/"
            fi
        fi
        
        echo "                        <li><a href=\"$url\" target=\"_blank\" rel=\"noopener\">$title</a></li>" >> "$temp_file_apps"
        
    done < "other-apps-repo.txt"
fi

# Sort the combined apps list alphabetically by title
sort_temp_file=$(mktemp)
sed 's|.*<a.*>\(.*\)</a.*|\1|' "$temp_file_apps" | paste -d'|' - "$temp_file_apps" | sort | cut -d'|' -f2- > "$sort_temp_file"
mv "$sort_temp_file" "$temp_file_apps"


# Replace content between <ol id="pages"> and </ol> tags for General Apps
sed -i${sed_backup:+' '} -e '/<ol id="pages">/,/<\/ol>/{/<ol id="pages">/!{/<\/ol>/!d}}' -e "/<ol id=\"pages\">/r $temp_file_apps" index.html

echo "Generated $(wc -l < "$temp_file_apps") Apps"

# Clean up
rm "$temp_file_apps"

echo "Index generation complete!" 