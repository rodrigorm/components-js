BASE = File.dirname(__FILE__) << '/..'

File.open("#{BASE}/dist/components.js", 'w+') do |f|
  put = Proc.new {|name| f.puts File.read("#{BASE}/src/#{name}") + "\n\n" }
  
  put.call('HEADER')
  put.call('global.js')

  f.puts 'var tree = (function() {'
  
  %w(class.js component.js tree.js request.js).each {|name| put.call(name) }
  
  f.puts 'return new Tree();'
  f.puts "})();\n\n"

  put.call('ready.js')
end