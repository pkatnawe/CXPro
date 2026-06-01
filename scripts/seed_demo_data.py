#!/usr/bin/env python3

"""
Seed DC-12 Hudson Valley demo project for local development / US-002.

Usage:
    python scripts/seed_demo_data.py
    python scripts/seed_demo_data.py --email you@example.com
"""

import argparse
import json
import os
import sys

import psycopg2
from dotenv import load_dotenv

load_dotenv('../.env.local')

DATABASE_URL = os.getenv('DATABASE_URL')
DEFAULT_EMAIL = os.getenv('SEED_USER_EMAIL', 'shlokp98@gmail.com')

if not DATABASE_URL:
    print("ERROR: DATABASE_URL not set in environment / ../.env.local")
    sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description='Seed DC-12 Hudson Valley demo project')
    parser.add_argument('--email', default=DEFAULT_EMAIL, help='User email to bind the project to')
    args = parser.parse_args()

    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = False
    cur = conn.cursor()

    try:
        cur.execute("SELECT id FROM auth.users WHERE email = %s", (args.email,))
        row = cur.fetchone()
        if not row:
            print(f"ERROR: No user found with email '{args.email}' in auth.users")
            sys.exit(1)
        user_id = row[0]
        print(f"Resolved user: {args.email} -> {user_id}")

        cur.execute("DELETE FROM projects WHERE name = 'DC-12 Hudson Valley (demo)'")
        deleted = cur.rowcount
        if deleted:
            print(f"Deleted {deleted} existing demo project(s) (cascade)")

        cur.execute("""
            INSERT INTO orgs (name, slug)
            VALUES ('Hudson DC LLC (demo)', 'hudson-dc-llc-demo')
            ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
            RETURNING id
        """)
        org_id = cur.fetchone()[0]
        print(f"Org: Hudson DC LLC (demo) -> {org_id}")

        cur.execute("""
            INSERT INTO memberships (user_id, org_id, role)
            VALUES (%s, %s, 'OCA')
            ON CONFLICT (user_id, org_id) DO NOTHING
        """, (user_id, org_id))

        cur.execute("""
            INSERT INTO projects (org_id, name, description)
            VALUES (%s, 'DC-12 Hudson Valley (demo)', 'Demo data center commissioning project — DC-12 Hudson Valley')
            RETURNING id
        """, (org_id,))
        project_id = cur.fetchone()[0]
        print(f"Project: DC-12 Hudson Valley (demo) -> {project_id}")

        for disc in ['Mechanical', 'Electrical', 'Controls', 'General Construction']:
            cur.execute("""
                INSERT INTO discipline_scopes (project_id, name)
                VALUES (%s, %s)
            """, (project_id, disc))

        cur.execute("""
            INSERT INTO participations (user_id, project_id)
            VALUES (%s, %s)
            ON CONFLICT (user_id, project_id) DO NOTHING
        """, (user_id, project_id))

        cur.execute("""
            INSERT INTO spaces (project_id, parent_space_id, kind, name, ordinal)
            VALUES (%s, NULL, 'building', 'DC-12 Building', 1)
            RETURNING id
        """, (project_id,))
        building_id = cur.fetchone()[0]

        hall_ids = {}
        for i, hall in enumerate(['Hall A', 'Hall B', 'Hall C'], start=1):
            cur.execute("""
                INSERT INTO spaces (project_id, parent_space_id, kind, name, ordinal)
                VALUES (%s, %s, 'data_hall', %s, %s)
                RETURNING id
            """, (project_id, building_id, hall, i))
            hall_ids[hall] = cur.fetchone()[0]

        row_ids = {}
        for row_name in ['Row 1', 'Row 2', 'Row 3']:
            cur.execute("""
                INSERT INTO spaces (project_id, parent_space_id, kind, name, ordinal)
                VALUES (%s, %s, 'rack_row', %s, %s)
                RETURNING id
            """, (project_id, hall_ids['Hall B'], row_name, int(row_name.split()[1])))
            row_ids[row_name] = cur.fetchone()[0]

        print(f"Spaces: Building + 3 Halls + 3 Rows under Hall B")

        asset_types = {}
        for at_name, desc in [
            ('AHU', 'Air Handling Unit'),
            ('PDU', 'Power Distribution Unit'),
            ('UPS', 'Uninterruptible Power Supply'),
            ('CRAH', 'Computer Room Air Handler'),
            ('Switchgear', 'Electrical Switchgear'),
        ]:
            cur.execute("""
                INSERT INTO asset_types (project_id, name, description, expected_attributes)
                VALUES (%s, %s, %s, %s)
                RETURNING id
            """, (project_id, at_name, desc, json.dumps({})))
            asset_types[at_name] = cur.fetchone()[0]

        print(f"AssetTypes: {list(asset_types.keys())}")

        assets = {}

        cur.execute("""
            INSERT INTO assets (project_id, asset_type_id, space_id, tag, name,
                                manufacturer, model, serial, vendor_name, nameplate_data)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (project_id, asset_types['Switchgear'], hall_ids['Hall A'],
              'SWG-A-01', 'Main Switchgear A',
              'Eaton', 'Pow-R-Center 2', 'SWG2024-0001',
              'Eaton Power Solutions',
              json.dumps({'rated_kva': '1500', 'voltage': '480V', 'amps': '1800A',
                          'install_date': '2024-03-15'})))
        assets['SWG-A-01'] = cur.fetchone()[0]

        cur.execute("""
            INSERT INTO assets (project_id, asset_type_id, space_id, parent_asset_id,
                                tag, name, manufacturer, model, serial, vendor_name, nameplate_data)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (project_id, asset_types['PDU'], hall_ids['Hall A'], assets['SWG-A-01'],
              'PDU-A-01', 'PDU Hall A Row 1',
              'Vertiv', 'Geist rPDU', 'PDU2024-0011',
              'Vertiv Co.',
              json.dumps({'rated_kva': '30', 'voltage': '208V', 'outlets': '24',
                          'install_date': '2024-04-01'})))
        assets['PDU-A-01'] = cur.fetchone()[0]

        cur.execute("""
            INSERT INTO assets (project_id, asset_type_id, space_id, parent_asset_id,
                                tag, name, manufacturer, model, serial, vendor_name, nameplate_data)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (project_id, asset_types['UPS'], hall_ids['Hall A'], assets['PDU-A-01'],
              'UPS-A-01', 'UPS Module A-1',
              'APC', 'Symmetra PX', 'UPS2024-0021',
              'APC by Schneider Electric',
              json.dumps({'rated_kva': '16', 'battery_runtime_min': '10',
                          'install_date': '2024-04-10'})))
        assets['UPS-A-01'] = cur.fetchone()[0]

        print(f"Parent/child chain: SWG-A-01 -> PDU-A-01 -> UPS-A-01")

        cur.execute("""
            INSERT INTO assets (project_id, asset_type_id, space_id, tag, name,
                                manufacturer, model, serial, vendor_name, nameplate_data)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (project_id, asset_types['CRAH'], hall_ids['Hall A'],
              'CRAH-A-01', 'CRAH Unit A-1',
              'Liebert', 'DS Series', 'CRAH2024-0031',
              'Vertiv (Liebert)',
              json.dumps({'cooling_kw': '50', 'airflow_cfm': '4000',
                          'refrigerant': 'R410A', 'install_date': '2024-03-20'})))
        assets['CRAH-A-01'] = cur.fetchone()[0]

        cur.execute("""
            INSERT INTO assets (project_id, asset_type_id, space_id, tag, name,
                                manufacturer, model, serial, vendor_name, nameplate_data)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (project_id, asset_types['AHU'], hall_ids['Hall A'],
              'AHU-A-01', 'AHU Hall A',
              'Trane', 'IntelliPak', 'AHU2024-0041',
              'Trane Technologies',
              json.dumps({'cooling_kw': '200', 'airflow_cfm': '15000',
                          'install_date': '2024-02-28'})))
        assets['AHU-A-01'] = cur.fetchone()[0]

        cur.execute("""
            INSERT INTO assets (project_id, asset_type_id, space_id, tag, name,
                                manufacturer, model, serial, vendor_name, nameplate_data)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (project_id, asset_types['Switchgear'], hall_ids['Hall B'],
              'SWG-B-01', 'Main Switchgear B',
              'Siemens', 'SIVACON 8PT', 'SWG2024-0002',
              'Siemens Energy',
              json.dumps({'rated_kva': '2000', 'voltage': '480V', 'amps': '2400A',
                          'install_date': '2024-03-18'})))
        assets['SWG-B-01'] = cur.fetchone()[0]

        cur.execute("""
            INSERT INTO assets (project_id, asset_type_id, space_id, parent_asset_id,
                                tag, name, manufacturer, model, serial, vendor_name, nameplate_data)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (project_id, asset_types['PDU'], row_ids['Row 1'], assets['SWG-B-01'],
              'PDU-B-01', 'PDU Hall B Row 1',
              'Vertiv', 'Geist rPDU', 'PDU2024-0012',
              'Vertiv Co.',
              json.dumps({'rated_kva': '30', 'voltage': '208V', 'outlets': '24',
                          'install_date': '2024-04-02'})))
        assets['PDU-B-01'] = cur.fetchone()[0]

        cur.execute("""
            INSERT INTO assets (project_id, asset_type_id, space_id, parent_asset_id,
                                tag, name, manufacturer, model, serial, vendor_name, nameplate_data)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (project_id, asset_types['PDU'], row_ids['Row 2'], assets['SWG-B-01'],
              'PDU-B-02', 'PDU Hall B Row 2',
              'Vertiv', 'Geist rPDU', 'PDU2024-0013',
              'Vertiv Co.',
              json.dumps({'rated_kva': '30', 'voltage': '208V', 'outlets': '24',
                          'install_date': '2024-04-03'})))
        assets['PDU-B-02'] = cur.fetchone()[0]

        cur.execute("""
            INSERT INTO assets (project_id, asset_type_id, space_id, parent_asset_id,
                                tag, name, manufacturer, model, serial, vendor_name, nameplate_data)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (project_id, asset_types['UPS'], row_ids['Row 1'], assets['PDU-B-01'],
              'UPS-B-01', 'UPS Module B-1',
              'Eaton', '9PX Series', 'UPS2024-0022',
              'Eaton Power Solutions',
              json.dumps({'rated_kva': '11', 'battery_runtime_min': '8',
                          'install_date': '2024-04-12'})))
        assets['UPS-B-01'] = cur.fetchone()[0]

        cur.execute("""
            INSERT INTO assets (project_id, asset_type_id, space_id, parent_asset_id,
                                tag, name, manufacturer, model, serial, vendor_name, nameplate_data)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (project_id, asset_types['UPS'], row_ids['Row 2'], assets['PDU-B-02'],
              'UPS-B-02', 'UPS Module B-2',
              'Eaton', '9PX Series', 'UPS2024-0023',
              'Eaton Power Solutions',
              json.dumps({'rated_kva': '11', 'battery_runtime_min': '8',
                          'install_date': '2024-04-13'})))
        assets['UPS-B-02'] = cur.fetchone()[0]

        cur.execute("""
            INSERT INTO assets (project_id, asset_type_id, space_id, tag, name,
                                manufacturer, model, serial, vendor_name, nameplate_data)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (project_id, asset_types['CRAH'], row_ids['Row 3'],
              'CRAH-B-01', 'CRAH Unit B-1',
              'Liebert', 'CRV Series', 'CRAH2024-0032',
              'Vertiv (Liebert)',
              json.dumps({'cooling_kw': '35', 'airflow_cfm': '3000',
                          'refrigerant': 'R410A', 'install_date': '2024-03-22'})))
        assets['CRAH-B-01'] = cur.fetchone()[0]

        cur.execute("""
            INSERT INTO assets (project_id, asset_type_id, space_id, tag, name,
                                manufacturer, model, serial, vendor_name, nameplate_data)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (project_id, asset_types['CRAH'], row_ids['Row 3'],
              'CRAH-B-02', 'CRAH Unit B-2',
              'Liebert', 'CRV Series', 'CRAH2024-0033',
              'Vertiv (Liebert)',
              json.dumps({'cooling_kw': '35', 'airflow_cfm': '3000',
                          'refrigerant': 'R410A', 'install_date': '2024-03-23'})))
        assets['CRAH-B-02'] = cur.fetchone()[0]

        cur.execute("""
            INSERT INTO assets (project_id, asset_type_id, space_id, tag, name,
                                manufacturer, model, serial, vendor_name, nameplate_data)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (project_id, asset_types['AHU'], hall_ids['Hall B'],
              'AHU-B-01', 'AHU Hall B',
              'Trane', 'IntelliPak', 'AHU2024-0042',
              'Trane Technologies',
              json.dumps({'cooling_kw': '250', 'airflow_cfm': '18000',
                          'install_date': '2024-03-01'})))
        assets['AHU-B-01'] = cur.fetchone()[0]

        cur.execute("""
            INSERT INTO assets (project_id, asset_type_id, space_id, tag, name,
                                manufacturer, model, serial, vendor_name, nameplate_data)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (project_id, asset_types['Switchgear'], hall_ids['Hall C'],
              'SWG-C-01', 'Main Switchgear C',
              'ABB', 'UniGear ZS1', 'SWG2024-0003',
              'ABB Ltd',
              json.dumps({'rated_kva': '1200', 'voltage': '480V', 'amps': '1500A',
                          'install_date': '2024-03-25'})))
        assets['SWG-C-01'] = cur.fetchone()[0]

        cur.execute("""
            INSERT INTO assets (project_id, asset_type_id, space_id, tag, name,
                                manufacturer, model, serial, vendor_name, nameplate_data)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (project_id, asset_types['CRAH'], hall_ids['Hall C'],
              'CRAH-C-01', 'CRAH Unit C-1',
              'Stulz', 'CyberAir 3PRO', 'CRAH2024-0034',
              'STULZ GmbH',
              json.dumps({'cooling_kw': '60', 'airflow_cfm': '5000',
                          'refrigerant': 'R407C', 'install_date': '2024-03-28'})))
        assets['CRAH-C-01'] = cur.fetchone()[0]

        print(f"Assets: {len(assets)} total")

        cur.execute("""
            INSERT INTO systems (project_id, name, description)
            VALUES (%s, %s, %s) RETURNING id
        """, (project_id, 'Cooling — Chilled Water',
              'Chilled water cooling loop serving all halls'))
        cooling_system_id = cur.fetchone()[0]

        cur.execute("""
            INSERT INTO systems (project_id, name, description)
            VALUES (%s, %s, %s) RETURNING id
        """, (project_id, 'Power — Hall B',
              'Primary power distribution for Hall B'))
        power_b_system_id = cur.fetchone()[0]

        for tag in ['CRAH-A-01', 'AHU-A-01', 'CRAH-B-01', 'CRAH-B-02', 'AHU-B-01', 'CRAH-C-01']:
            cur.execute("""
                INSERT INTO asset_system_memberships (asset_id, system_id)
                VALUES (%s, %s)
            """, (assets[tag], cooling_system_id))

        for tag in ['SWG-B-01', 'PDU-B-01', 'PDU-B-02', 'UPS-B-01', 'UPS-B-02']:
            cur.execute("""
                INSERT INTO asset_system_memberships (asset_id, system_id)
                VALUES (%s, %s)
            """, (assets[tag], power_b_system_id))

        print("Systems: Cooling — Chilled Water, Power — Hall B")

        templates = {}
        template_defs = [
            ('AHU Pre-functional Checklist', 'L2', 'AHU',
             [{'step': 'Verify unit mounting', 'type': 'check'},
              {'step': 'Confirm belt tension', 'type': 'check'},
              {'step': 'Check filter installation', 'type': 'check'}]),
            ('AHU Functional Test', 'L3', 'AHU',
             [{'step': 'Start unit, verify airflow', 'type': 'check'},
              {'step': 'Measure supply/return temps', 'type': 'measure'},
              {'step': 'Verify controls response', 'type': 'check'}]),
            ('PDU Pre-functional Checklist', 'L2', 'PDU',
             [{'step': 'Verify breaker labeling', 'type': 'check'},
              {'step': 'Torque connections', 'type': 'check'},
              {'step': 'Insulation resistance test', 'type': 'measure'}]),
            ('UPS IST Protocol', 'L5', 'UPS',
             [{'step': 'Battery discharge test', 'type': 'measure'},
              {'step': 'Transfer time verification', 'type': 'measure'},
              {'step': 'Alarm annunciation test', 'type': 'check'}]),
            ('CRAH Functional Performance Test', 'L3', 'CRAH',
             [{'step': 'Verify set-point tracking', 'type': 'check'},
              {'step': 'Measure delta-T across coil', 'type': 'measure'},
              {'step': 'Test economizer mode', 'type': 'check'}]),
        ]

        for tpl_name, level, at_key, steps in template_defs:
            cur.execute("""
                INSERT INTO test_procedure_templates (project_id, name, level, steps)
                VALUES (%s, %s, %s, %s) RETURNING id
            """, (project_id, tpl_name, level, json.dumps(steps)))
            tpl_id = cur.fetchone()[0]
            templates[tpl_name] = {'id': tpl_id, 'level': level, 'at_key': at_key}

            cur.execute("""
                INSERT INTO asset_type_template_links (asset_type_id, test_procedure_template_id)
                VALUES (%s, %s)
            """, (asset_types[at_key], tpl_id))

        print(f"Templates: {len(templates)} (L2/L3/L5)")

        instances_data = [
            ('AHU-A-01', 'AHU Pre-functional Checklist', 'complete'),
            ('AHU-A-01', 'AHU Functional Test', 'in_progress'),
            ('AHU-B-01', 'AHU Pre-functional Checklist', 'complete'),
            ('AHU-B-01', 'AHU Functional Test', 'pending'),
            ('PDU-A-01', 'PDU Pre-functional Checklist', 'complete'),
            ('PDU-B-01', 'PDU Pre-functional Checklist', 'complete'),
            ('PDU-B-02', 'PDU Pre-functional Checklist', 'in_progress'),
            ('UPS-A-01', 'UPS IST Protocol', 'pending'),
            ('UPS-B-01', 'UPS IST Protocol', 'in_progress'),
            ('UPS-B-02', 'UPS IST Protocol', 'pending'),
            ('CRAH-A-01', 'CRAH Functional Performance Test', 'complete'),
            ('CRAH-B-01', 'CRAH Functional Performance Test', 'in_progress'),
            ('CRAH-B-02', 'CRAH Functional Performance Test', 'pending'),
        ]

        instance_count = 0
        for asset_tag, tpl_name, status in instances_data:
            tpl = templates[tpl_name]
            cur.execute("""
                INSERT INTO test_procedure_instances
                    (project_id, template_id, asset_id, level, status)
                VALUES (%s, %s, %s, %s, %s)
            """, (project_id, tpl['id'], assets[asset_tag], tpl['level'], status))
            instance_count += 1

        print(f"TestProcedureInstances: {instance_count}")

        conn.commit()
        print()
        print(f"Seed complete!")
        print(f"  project_id: {project_id}")
        print(f"  http://localhost:3000/project/{project_id}/assets")

    except Exception as e:
        conn.rollback()
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        cur.close()
        conn.close()


if __name__ == '__main__':
    main()
