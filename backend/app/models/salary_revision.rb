# One change to an employee's salary. Written by Employee whenever salary
# changes, so the history can't be skipped by a normal edit.
class SalaryRevision < ApplicationRecord
  belongs_to :employee

  validates :new_salary, presence: true
end
