module Jekyll
  module RegexFilter
    def match_regex(input, regex)
      matches = input.match(Regexp.new(regex))
      matches ? matches.captures : nil
    end
  end
end

Liquid::Template.register_filter(Jekyll::RegexFilter) 