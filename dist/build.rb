BASE = File.dirname(__FILE__) << '/..'

File.open("#{BASE}/dist/components.js", 'w+') do |f|
  f.puts File.read("#{BASE}/src/HEADER")
  
  f.puts(%w(class component tree request global).map do |source|
    File.read("#{BASE}/src/#{source}.js")
  end.join("\n\n"))
end