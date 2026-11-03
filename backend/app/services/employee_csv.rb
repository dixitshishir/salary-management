require "csv"

# CSV export and import, so HR can move between this app and spreadsheets.
# Export columns are a superset of import columns, so an exported file can be
# edited in Excel and imported back.
module EmployeeCsv
  COLUMNS = %w[employee_code first_name last_name email job_title department
               country_code salary employment_type hire_date].freeze

  class Export
    # Cells starting with these are run as formulas by Excel (CSV injection).
    FORMULA_PREFIXES = [ "=", "+", "-", "@", "\t", "\r" ].freeze

    def initialize(scope)
      @scope = scope
    end

    def call
      CSV.generate do |csv|
        csv << COLUMNS + %w[currency salary_usd]
        @scope.find_each do |employee|
          values = COLUMNS.map { |column| employee.public_send(column) }
          csv << (values + [ employee.currency, employee.salary_usd ]).map { |value| safe(value) }
        end
      end
    end

    private

    def safe(value)
      return value unless value.is_a?(String) && value.start_with?(*FORMULA_PREFIXES)

      "'#{value}"
    end
  end

  class Import
    MAX_ROWS = 20_000

    Result = Struct.new(:created, :updated, :unchanged, :errors, keyword_init: true)

    def initialize(content)
      @content = content
    end

    # Rows are saved one at a time so each gets model validation and salary
    # history; a bad row is reported and skipped, not fatal. One transaction
    # around the loop keeps SQLite fast (one fsync instead of thousands).
    def call
      result = Result.new(created: 0, updated: 0, unchanged: 0, errors: [])
      table = CSV.parse(@content.to_s.delete_prefix("﻿"), headers: true, skip_blanks: true)

      missing = COLUMNS - table.headers.compact.map(&:strip)
      return header_error(result, "Missing columns: #{missing.join(', ')}") if missing.any?
      return header_error(result, "Too many rows (max #{MAX_ROWS})") if table.size > MAX_ROWS

      Employee.transaction do
        table.each.with_index(2) { |row, line| import_row(row, line, result) }
      end
      result
    end

    private

    def import_row(row, line, result)
      attrs = COLUMNS.to_h { |column| [ column, row[column]&.strip ] }
      code = attrs["employee_code"].presence
      employee = (code && Employee.find_by(employee_code: code)) || Employee.new
      new_record = employee.new_record?

      employee.assign_attributes(attrs.except("hire_date"))
      employee.hire_date = parse_date(attrs["hire_date"])
      employee.salary_change_reason = "CSV import"

      return result.unchanged += 1 unless employee.changed?
      return record_error(result, line, code, employee) unless valid_row?(employee, attrs["hire_date"]) && employee.save

      new_record ? result.created += 1 : result.updated += 1
    end

    # A hire date we couldn't parse gets a clearer message than "can't be blank".
    def valid_row?(employee, raw_hire_date)
      return true if raw_hire_date.blank? || employee.hire_date

      employee.validate
      employee.errors.delete(:hire_date)
      employee.errors.add(:hire_date, "must be a date in YYYY-MM-DD format")
      false
    end

    def parse_date(value)
      Date.iso8601(value.to_s)
    rescue Date::Error
      nil
    end

    def record_error(result, line, code, employee)
      result.errors << { line:, employee_code: code, messages: employee.errors.full_messages }
    end

    def header_error(result, message)
      result.errors << { line: 1, employee_code: nil, messages: [ message ] }
      result
    end
  end
end
