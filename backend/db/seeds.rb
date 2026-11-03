# Seeds ACME's workforce: 10,000 employees by default.
#   bin/rails db:seed
#   SEED_COUNT=500 bin/rails db:seed
# Re-running replaces the existing employees; the same seed always gives the same people.
count = Integer(ENV.fetch("SEED_COUNT", 10_000))
started = Process.clock_gettime(Process::CLOCK_MONOTONIC)

EmployeeSeeder.new(count:).call

elapsed = Process.clock_gettime(Process::CLOCK_MONOTONIC) - started
puts "Seeded #{count} employees in #{elapsed.round(2)}s"
