BASE = File.dirname(__FILE__)

File.open("#{BASE}/dist/components.js", 'w+') do |f|
  put = Proc.new {|name| f.puts File.read("#{BASE}/src/#{name}") + "\n\n" }
  
  put.call('HEADER')
  put.call('global.js')
  put.call('component.js')
  put.call('template.js')
  put.call('ready.js')
end