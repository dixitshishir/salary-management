class Employee < ApplicationRecord
  EMPLOYMENT_TYPES = %w[full_time part_time contract].freeze
  CODE_FORMAT = "EMP-%05d".freeze

  has_many :salary_revisions, dependent: :delete_all

  # Set by the caller when salary changes, so the audit trail says why.
  attr_accessor :salary_change_reason

  normalizes :email, with: ->(email) { email.strip.downcase }
  normalizes :first_name, :last_name, :job_title, :department, with: ->(value) { value.squish }
  normalizes :country_code, with: ->(code) { code.strip.upcase }

  validates :first_name, :last_name, :job_title, :department, :hire_date, presence: true
  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :employee_code, uniqueness: true, allow_nil: true
  validates :salary, presence: true, numericality: { only_integer: true, greater_than: 0 }
  validates :country_code, presence: true
  validates :country_code, inclusion: { in: ->(_) { Country.codes }, message: "is not a country ACME operates in" },
                           allow_blank: true
  validates :employment_type, presence: true, inclusion: { in: EMPLOYMENT_TYPES, allow_blank: true }
  validate :hire_date_not_in_future

  before_create :assign_employee_code
  after_save :record_salary_revision, if: :saved_change_to_salary?

  def full_name = "#{first_name} #{last_name}"

  def country = Country.find(country_code)

  def currency = country&.currency

  def salary_usd = country && salary && country.to_usd(salary)

  private

  def hire_date_not_in_future
    errors.add(:hire_date, "can't be in the future") if hire_date&.future?
  end

  # The unique index on employee_code is the real guard; two concurrent
  # creates can pick the same number, and the loser gets a validation error.
  def assign_employee_code
    return if employee_code.present?

    last_number = Employee.where("employee_code LIKE 'EMP-%'").maximum(:employee_code).to_s.delete_prefix("EMP-").to_i
    self.employee_code = format(CODE_FORMAT, last_number + 1)
  end

  def record_salary_revision
    previous, current = saved_change_to_salary
    salary_revisions.create!(
      previous_salary: previous,
      new_salary: current,
      reason: salary_change_reason.presence || (previous.nil? ? "Hired" : nil)
    )
  end
end
