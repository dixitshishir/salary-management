require "rails_helper"

RSpec.describe Employee do
  subject(:employee) { build(:employee) }

  describe "validations" do
    it "is valid with the factory defaults" do
      expect(employee).to be_valid
    end

    %i[first_name last_name email job_title department country_code salary hire_date employment_type].each do |attr|
      it "requires #{attr}" do
        employee.public_send("#{attr}=", nil)

        expect(employee).not_to be_valid
        expect(employee.errors[attr]).to be_present
      end
    end

    it "rejects a salary that is zero or negative" do
      employee.salary = 0

      expect(employee).not_to be_valid
      expect(employee.errors[:salary]).to include("must be greater than 0")
    end

    it "rejects a fractional salary" do
      employee.salary = 1000.5

      expect(employee).not_to be_valid
    end

    it "rejects a country we do not operate in" do
      employee.country_code = "XX"

      employee.validate
      expect(employee.errors[:country_code]).to include("is not a country ACME operates in")
    end

    it "rejects an unknown employment type" do
      employee.employment_type = "intern"

      expect(employee).not_to be_valid
    end

    it "rejects a hire date in the future" do
      employee.hire_date = Date.current + 1

      employee.validate
      expect(employee.errors[:hire_date]).to include("can't be in the future")
    end

    it "rejects a malformed email" do
      employee.email = "not-an-email"

      expect(employee).not_to be_valid
    end

    it "treats emails as case-insensitive and unique" do
      create(:employee, email: "Asha.Rao@acme.test")
      employee.email = "asha.rao@ACME.test"

      employee.validate
      expect(employee.errors[:email]).to include("has already been taken")
    end
  end

  describe "employee code" do
    it "is assigned automatically on create when left blank" do
      first = create(:employee, employee_code: nil)
      second = create(:employee, employee_code: nil)

      expect(first.employee_code).to match(/\AEMP-\d{5}\z/)
      expect(second.employee_code).not_to eq(first.employee_code)
    end

    it "keeps a code that was supplied" do
      expect(create(:employee, employee_code: "EMP-04242").employee_code).to eq("EMP-04242")
    end
  end

  describe "money" do
    it "is paid in its country's currency" do
      expect(build(:employee, country_code: "JP").currency).to eq("JPY")
    end

    it "converts its salary to USD for reporting" do
      expect(build(:employee, country_code: "IN", salary: 4_400_000).salary_usd).to eq(50_000)
    end
  end

  describe "salary revisions" do
    it "records the starting salary when the employee is created" do
      employee = create(:employee, salary: 90_000)

      expect(employee.salary_revisions.map { |r| [r.previous_salary, r.new_salary] }).to eq([[nil, 90_000]])
    end

    it "records old and new salary with the reason when salary changes" do
      employee = create(:employee, salary: 90_000)

      employee.update!(salary: 99_000, salary_change_reason: "Annual review")

      latest = employee.salary_revisions.order(:id).last
      expect([latest.previous_salary, latest.new_salary, latest.reason]).to eq([90_000, 99_000, "Annual review"])
    end

    it "does not record a revision when only other fields change" do
      employee = create(:employee)

      expect { employee.update!(job_title: "Staff Engineer") }.not_to change(SalaryRevision, :count)
    end
  end

  it "joins first and last name" do
    expect(build(:employee, first_name: "Asha", last_name: "Rao").full_name).to eq("Asha Rao")
  end
end
