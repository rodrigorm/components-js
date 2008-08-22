File.open('dist/components.js', 'w+') do |f|
  f.puts(File.read('src/HEADER'))
  
  %w(class component tree request transition globals).each do |source|
    f.puts(File.read("src/#{source}.js"))
    f.puts("\n")
  end
end