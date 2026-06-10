package com.opticrm.agent.gui;

import com.opticrm.agent.config.AgentProperties;
import com.opticrm.agent.config.ConfigPersister;
import com.opticrm.agent.sage.SageConnection;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import javax.swing.*;
import javax.swing.border.EmptyBorder;
import java.awt.*;

@Component
@RequiredArgsConstructor
public class SageConfigPanel {

    private final AgentProperties props;
    private final ConfigPersister persister;
    private final SageConnection sageConnection;

    public JPanel build() {
        JPanel root = new JPanel(new BorderLayout(10, 10));
        root.setBorder(new EmptyBorder(15, 15, 15, 15));

        JPanel form = new JPanel(new GridBagLayout());
        GridBagConstraints g = new GridBagConstraints();
        g.insets = new Insets(6, 6, 6, 6);
        g.anchor = GridBagConstraints.WEST;
        g.fill = GridBagConstraints.HORIZONTAL;

        JTextField hostField     = new JTextField(props.getSage().getHost(), 25);
        JSpinner portField       = new JSpinner(new SpinnerNumberModel(props.getSage().getPort(), 1, 65535, 1));
        JTextField dbField       = new JTextField(props.getSage().getDatabase(), 25);
        JTextField userField     = new JTextField(props.getSage().getUsername(), 25);
        JPasswordField pwdField  = new JPasswordField(props.getSage().getPassword(), 25);
        JTextField dossierField  = new JTextField(props.getSage().getDossier(), 25);

        int row = 0;
        addRow(form, g, row++, "Adresse SQL Server :", hostField);
        addRow(form, g, row++, "Port :", portField);
        addRow(form, g, row++, "Base de données :", dbField);
        addRow(form, g, row++, "Utilisateur :", userField);
        addRow(form, g, row++, "Mot de passe :", pwdField);
        addRow(form, g, row++, "Dossier Sage (optionnel) :", dossierField);

        JLabel jdbcLabel = new JLabel();
        jdbcLabel.setForeground(Color.GRAY);
        jdbcLabel.setFont(new Font(Font.MONOSPACED, Font.PLAIN, 11));
        Runnable refreshJdbc = () -> jdbcLabel.setText(
                "<html><b>JDBC :</b> jdbc:sqlserver://" + hostField.getText() + ":" + portField.getValue()
                        + ";databaseName=" + dbField.getText() + ";encrypt=false</html>");
        refreshJdbc.run();
        hostField.addActionListener(e -> refreshJdbc.run());

        g.gridx = 0; g.gridy = row; g.gridwidth = 2;
        form.add(jdbcLabel, g);

        root.add(form, BorderLayout.NORTH);

        JTextArea status = new JTextArea(8, 60);
        status.setEditable(false);
        status.setBackground(new Color(245, 245, 245));
        status.setFont(new Font(Font.MONOSPACED, Font.PLAIN, 12));
        status.setBorder(BorderFactory.createTitledBorder("Résultat"));
        root.add(new JScrollPane(status), BorderLayout.CENTER);

        JPanel buttons = new JPanel(new FlowLayout(FlowLayout.RIGHT));
        JButton testBtn = new JButton("Tester la connexion");
        JButton saveBtn = new JButton("Enregistrer");
        buttons.add(testBtn);
        buttons.add(saveBtn);
        root.add(buttons, BorderLayout.SOUTH);

        Runnable readForm = () -> {
            props.getSage().setHost(hostField.getText().trim());
            props.getSage().setPort((Integer) portField.getValue());
            props.getSage().setDatabase(dbField.getText().trim());
            props.getSage().setUsername(userField.getText().trim());
            props.getSage().setPassword(new String(pwdField.getPassword()));
            props.getSage().setDossier(dossierField.getText().trim());
        };

        testBtn.addActionListener(e -> {
            readForm.run();
            refreshJdbc.run();
            status.setText("Connexion en cours…\n");
            new SwingWorker<String, Void>() {
                @Override protected String doInBackground() {
                    long t = System.currentTimeMillis();
                    boolean ok = sageConnection.ping();
                    long ms = System.currentTimeMillis() - t;
                    return ok
                            ? "✓ Connexion SQL Server établie (" + ms + " ms)"
                            : "✗ Connexion impossible — vérifiez host, port et identifiants";
                }
                @Override protected void done() {
                    try { status.setText(get()); } catch (Exception ex) { status.setText(ex.getMessage()); }
                }
            }.execute();
        });

        saveBtn.addActionListener(e -> {
            readForm.run();
            persister.save(props);
            status.setText("Configuration enregistrée dans agent-config.yml");
        });

        return root;
    }

    private void addRow(JPanel form, GridBagConstraints g, int row, String label, JComponent field) {
        g.gridx = 0; g.gridy = row; g.weightx = 0; g.gridwidth = 1;
        form.add(new JLabel(label), g);
        g.gridx = 1; g.gridy = row; g.weightx = 1.0;
        form.add(field, g);
    }
}
