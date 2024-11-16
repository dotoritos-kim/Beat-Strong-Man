import React, { ReactComponentElement, ReactElement, Component, Fragment } from 'react';
import { Col, Container, Row } from 'reactstrap';
function FooterPage() {
    return (
        <footer className="footer">
            <Container fluid>
                <Row>
                    <Col sm={6}>{new Date().getFullYear()} ©</Col>
                    <Col sm={6}>
                        <div className="text-sm-end d-none d-sm-block"></div>
                    </Col>
                </Row>
            </Container>
        </footer>
    );
}

export default FooterPage;
