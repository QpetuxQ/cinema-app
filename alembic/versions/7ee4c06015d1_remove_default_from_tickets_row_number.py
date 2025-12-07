"""remove default from tickets.row_number

Revision ID: 7ee4c06015d1
Revises: 155f08fe8533
Create Date: 2025-11-06 16:04:24.967579

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7ee4c06015d1'
down_revision: Union[str, Sequence[str], None] = '155f08fe8533'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.alter_column('tickets', 'row_number', server_default=None)

def downgrade():
    op.alter_column('tickets', 'row_number', server_default='1')
