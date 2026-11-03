# Generates realistic, reproducible employees for demos and performance checks.
#
#   EmployeeSeeder.new(count: 10_000).call
#
# Everything is driven by one seeded Random, so the same seed always yields
# the same people. Rows go in with insert_all in batches (no per-row callbacks),
# which keeps 10,000 employees to a couple of seconds.
class EmployeeSeeder
  BATCH_SIZE = 1_000

  # Rough share of the workforce in each country.
  COUNTRY_WEIGHTS = {
    "IN" => 30, "US" => 25, "GB" => 10, "DE" => 8, "CA" => 6,
    "AU" => 5, "SG" => 5, "JP" => 4, "BR" => 4, "AE" => 3
  }.freeze

  # Pay level relative to the US for the same role.
  COUNTRY_PAY_FACTOR = {
    "IN" => 0.28, "US" => 1.0, "GB" => 0.72, "DE" => 0.78, "CA" => 0.80,
    "AU" => 0.82, "SG" => 0.75, "JP" => 0.62, "BR" => 0.32, "AE" => 0.70
  }.freeze

  # job title => [department, US base salary in USD, relative headcount]
  JOBS = {
    "Software Engineer"           => ["Engineering", 115_000, 14],
    "Senior Software Engineer"    => ["Engineering", 150_000, 9],
    "Staff Engineer"              => ["Engineering", 190_000, 2],
    "Engineering Manager"         => ["Engineering", 180_000, 3],
    "QA Engineer"                 => ["Engineering", 90_000, 5],
    "DevOps Engineer"             => ["Engineering", 125_000, 4],
    "Product Manager"             => ["Product", 145_000, 4],
    "Product Designer"            => ["Product", 115_000, 3],
    "Data Analyst"                => ["Data", 85_000, 4],
    "Data Scientist"              => ["Data", 135_000, 3],
    "Sales Executive"             => ["Sales", 75_000, 9],
    "Account Manager"             => ["Sales", 85_000, 6],
    "Marketing Specialist"        => ["Marketing", 70_000, 5],
    "Financial Analyst"           => ["Finance", 85_000, 3],
    "Accountant"                  => ["Finance", 70_000, 3],
    "HR Generalist"               => ["People", 65_000, 3],
    "Recruiter"                   => ["People", 70_000, 3],
    "Customer Support Specialist" => ["Customer Support", 50_000, 12],
    "Operations Manager"          => ["Operations", 100_000, 3]
  }.freeze

  FIRST_NAMES = %w[
    Aarav Aditi Akira Amara Ana Arjun Asha Ben Camila Chen Chloe Daniel Diya Elena Emma Ethan
    Fatima Felix Gabriel Hana Hannah Ibrahim Isabella Ishaan Jack Jonas Kavya Kenji Laila Lena
    Liam Lucas Maya Mei Mohammed Noah Nora Olivia Omar Priya Rahul Riya Sakura Sara Sofia Tariq
    Thomas Vikram Yuki Zara
  ].freeze

  LAST_NAMES = %w[
    Ahmed Almeida Bauer Brown Chen Costa Das Fischer Garcia Gupta Hassan Iyer Johnson Kapoor
    Khan Kim Kumar Lee Martin Mehta Meyer Mueller Nair Nakamura Nguyen Oliveira Patel Rao Reddy
    Rodriguez Sato Schmidt Shah Sharma Silva Singh Smith Suzuki Tan Taylor Thomas Walker Wang
    Weber Williams Wilson Wong Yamamoto Zhang
  ].freeze

  def initialize(count:, seed: 42, today: Date.new(2026, 11, 1))
    @count = count
    @random = Random.new(seed)
    @today = today
  end

  def call
    Employee.transaction do
      SalaryRevision.delete_all
      Employee.delete_all
      (1..@count).each_slice(BATCH_SIZE) do |numbers|
        Employee.insert_all!(numbers.map { |n| build(n) })
      end
      record_hiring_salaries
    end
    @count
  end

  private

  def build(number)
    first_name = FIRST_NAMES.sample(random: @random)
    last_name = LAST_NAMES.sample(random: @random)
    country_code = weighted_pick(COUNTRY_WEIGHTS)
    job_title = weighted_pick(JOBS.transform_values(&:last))
    department, base_usd, = JOBS.fetch(job_title)

    {
      employee_code: format(Employee::CODE_FORMAT, number),
      first_name:,
      last_name:,
      email: "#{first_name}.#{last_name}.#{number}@acme.test".downcase,
      job_title:,
      department:,
      country_code:,
      salary: local_salary(base_usd, country_code),
      employment_type: weighted_pick("full_time" => 85, "part_time" => 7, "contract" => 8),
      hire_date: @today - @random.rand(30..(12 * 365)),
      created_at: Time.current,
      updated_at: Time.current
    }
  end

  # US base x country factor x individual spread (about +/-25%), converted to
  # local currency and rounded to a "clean" number like HR would offer.
  def local_salary(base_usd, country_code)
    usd = base_usd * COUNTRY_PAY_FACTOR.fetch(country_code) * @random.rand(0.75..1.25)
    local = Country.find(country_code).from_usd(usd)
    step = local >= 1_000_000 ? 10_000 : 1_000
    [(local / step).round * step, step].max
  end

  def weighted_pick(weights)
    target = @random.rand(weights.values.sum)
    weights.each do |value, weight|
      return value if target < weight

      target -= weight
    end
  end

  # One "Hired" revision per employee, so every salary history has a start.
  def record_hiring_salaries
    SalaryRevision.connection.execute(<<~SQL)
      INSERT INTO salary_revisions (employee_id, previous_salary, new_salary, reason, created_at, updated_at)
      SELECT id, NULL, salary, 'Hired', hire_date, hire_date FROM employees
    SQL
  end
end
