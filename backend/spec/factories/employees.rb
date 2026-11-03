FactoryBot.define do
  factory :employee do
    sequence(:employee_code) { |n| format("EMP-9%04d", n) }
    first_name { "Asha" }
    last_name { "Rao" }
    sequence(:email) { |n| "employee#{n}@acme.test" }
    job_title { "Software Engineer" }
    department { "Engineering" }
    country_code { "IN" }
    salary { 1_800_000 }
    employment_type { "full_time" }
    hire_date { Date.new(2022, 4, 1) }
  end
end
