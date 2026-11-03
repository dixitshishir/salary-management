class CreateSalaryRevisions < ActiveRecord::Migration[8.1]
  def change
    create_table :salary_revisions do |t|
      t.references :employee, null: false, foreign_key: true, index: false
      t.bigint :previous_salary
      t.bigint :new_salary, null: false
      t.string :reason
      t.timestamps
    end

    add_index :salary_revisions, %i[employee_id created_at]
  end
end
